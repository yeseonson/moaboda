# 마이그레이션

Supabase SQL Editor 에서 직접 실행한 일회성 스크립트를 모아둔다.
자동으로 돌지 않는다 — 기록을 남기고, 값을 되살려야 할 때 참조하기 위한 것.

실행 순서대로 적는다.

| 파일 | 내용 |
| --- | --- |
| `import_관극이력.sql` | Notion 관극 이력 158건. 공연 79편은 KOPIS 에서 kopis_id·포스터·공연장·기간·출연진을 채웠다 |
| `import_왓챠영화.sql` | 왓챠 영화 852건 (TV 122건 제외). TMDB 에서 tmdb_id·포스터·장르·출연진을 채웠다. 관람일이 없는 417건은 `view_start = null` |
| `fix_출연진_등제거.sql` | KOPIS 가 마지막 이름 뒤에 붙여 보내는 "등" 을 배열 원소에서 제거 |
| `import_독서기록.sql` | 노션 BOOK LOG 56건. 알라딘에서 isbn·표지를 채웠다. 매칭 53 / 미매칭 3 |

미매칭 3건(`여행은 늘 나보다 늦게 온다`, `고갱이`, `천녀유혼`)은 알라딘 DB 에 아예 없다.
독립출판·북클럽 굿즈라 검색이 안 된다. isbn 과 표지를 비운 채 노션 정보만 넣었으니
표지가 필요하면 앱에서 직접 채운다. isbn 이 null 이라 중복 방지는 제목+지은이로 한다.

## 함께 적용한 스키마 변경

파일로 남기지 않고 바로 실행한 것들.

```sql
-- 컬럼
alter table records add column "cast" text[];   -- 그날 본 배우 (공연 전체 출연진은 performances.cast)
alter table records rename column venue to cinema;
alter table records add column ott text;        -- cinema 와 배타

-- 카탈로그 자연키. resolveWorkId 의 upsert 가 이 제약에 기댄다
alter table performances add constraint performances_kopis_id_key unique (kopis_id);
alter table movies       add constraint movies_tmdb_id_key        unique (tmdb_id);
alter table books        add constraint books_isbn_key            unique (isbn);

-- 무결성
alter table records add constraint records_category_fk_ck check (
  case category
    when 'performance' then movie_id is null and book_id is null
    when 'movie'       then performance_id is null and book_id is null
    when 'book'        then performance_id is null and movie_id is null
  end
);
alter table records add constraint records_watch_place_ck check (cinema is null or ott is null);
alter table records add constraint records_book_fields_ck  check (read_count is null or category = 'book');
alter table records add constraint records_movie_fields_ck check ((cinema is null and ott is null) or category = 'movie');
alter table records add constraint records_rating_ck       check (rating is null or (rating between 1 and 5));
alter table records add constraint records_view_range_ck   check (view_end is null or view_start is null or view_end >= view_start);

-- 카탈로그 RLS. records_owner 와 같은 모양(public role)으로 맞춘다.
-- 공유 테이블이라 user_id 가 없어 "로그인했는지" 만 본다
create policy moa_catalog_all on books
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
-- movies, performances 도 동일
```

## 되돌린 것

`update records set rating = floor(rating)` 로 공연 71건의 반 단계 평점을 정수로 내렸다가,
왓챠 데이터가 절반 이상 반 단계여서 다시 되살렸다.
복원은 `import_관극이력.sql` 의 원본 값을 근거로 했다 — **임포트 SQL 을 지우지 말 것.**
