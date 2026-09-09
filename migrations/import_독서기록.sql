-- 노션 BOOK LOG 임포트
-- 생성일: 2026-09-09
-- 책 56건. 알라딘 매칭 53 / 미매칭 3
-- 미매칭 3건(여행은 늘 나보다 늦게 온다, 고갱이, 천녀유혼)은 알라딘에 없는 책이라
-- isbn·표지 없이 노션 정보만 넣는다. 앱에서 표지를 직접 채우면 된다.
-- 평점은 노션의 달 이모지 기준 (🌕 = 1, 🌗 = 0.5).
-- 같은 (책 + 독서 시작일) 기록이 이미 있으면 건너뛴다. 여러 번 실행해도 안전하다.

begin;

-- 1) 책 카탈로그 53건 (알라딘 매칭분)
insert into books (isbn, title, poster_url, author, publisher, genre)
select v.isbn, v.title, v.poster_url, v.author, v.publisher, v.genre
from (values
  ('9788901297453', '나는 메트로폴리탄 미술관의 경비원입니다', 'https://image.aladin.co.kr/product/37231/18/cover200/8901297450_2.jpg', '패트릭 브링리', '웅진지식하우스', '에세이'),
  ('9791191824001', '지구 끝의 온실', 'https://image.aladin.co.kr/product/27692/63/cover200/s222930473_1.jpg', '김초엽', '자이언트북스', '소설'),
  ('9791197510601', '나의 무섭고 애처로운 환자들', 'https://image.aladin.co.kr/product/27524/81/cover200/k082733296_1.jpg', '차승민', '아몬드', '에세이, 인문'),
  ('9791167900821', '므레모사', 'https://image.aladin.co.kr/product/28554/97/cover200/k162835148_1.jpg', '김초엽', '현대문학', '소설'),
  ('9791168340510', '파친코 1', 'https://image.aladin.co.kr/product/29496/39/cover200/s382931339_2.jpg', '이민진', '인플루엔셜', '소설'),
  ('9791168340541', '파친코 2', 'https://image.aladin.co.kr/product/29496/41/cover200/k192838537_2.jpg', '이민진', '인플루엔셜', '소설'),
  ('9791191114225', '작별인사', 'https://image.aladin.co.kr/product/29281/68/cover200/k122837904_2.jpg', '김영하', '복복서가', '소설'),
  ('9791198275097', '카프카의 프라하', 'https://image.aladin.co.kr/product/34457/77/cover200/k242932436_2.jpg', '최유안', '소전서가', '에세이'),
  ('9788936439002', '두고 온 여름', 'https://image.aladin.co.kr/product/31294/95/cover200/8936439006_1.jpg', '성해나', '창비', '소설'),
  ('9788954681155', '홍학의 자리', 'https://image.aladin.co.kr/product/27587/94/cover200/8954681158_1.jpg', '정해연', '엘릭시르', '소설'),
  ('9791173741524', '우리는 무엇을 타고나는가', 'https://image.aladin.co.kr/product/37189/2/cover200/k022031294_1.jpg', '케빈 J. 미첼', '오픈도어북스', '과학'),
  ('9791192638461', '영화 보고 오는 길에 글을 썼습니다', 'https://image.aladin.co.kr/product/34621/33/cover200/k092933287_1.jpg', '김중혁', '안온북스', '에세이'),
  ('9788925568645', '프로젝트 헤일메리', 'https://image.aladin.co.kr/product/39679/83/cover200/8925568640_1.jpg', '앤디 위어', '알에이치코리아', '소설'),
  ('9788954618373', '프랑켄슈타인', 'https://image.aladin.co.kr/product/1742/16/cover200/s762836513_1.jpg', '메리 셸리', '문학동네', '소설'),
  ('9791155818831', '해석에 반하여', 'https://image.aladin.co.kr/product/37633/95/cover200/k962032248_2.jpg', '수전 손택', '윌북', '인문'),
  ('9791197325809', '나의 이브 생 로랑에게', 'https://image.aladin.co.kr/product/30892/14/cover200/k832831489_1.jpg', '피에르 베르제', '프란츠', '에세이'),
  ('9791193078563', '토막 난 우주를 안고서', 'https://image.aladin.co.kr/product/36527/50/cover200/k982039620_1.jpg', '김초엽, 김혜윤, 조서월, 천선란, 청예', '허블', '소설'),
  ('9791193401583', '최소한의 삼국지', 'https://image.aladin.co.kr/product/37773/21/cover200/k002033562_2.jpg', '최태성', '프런트페이지', '인문'),
  ('9791197325892', '음악소설집', 'https://image.aladin.co.kr/product/34130/64/cover200/k222931917_2.jpg', '김애란, 김연수, 윤성희, 은희경, 편혜영', '프란츠', '소설'),
  ('9791193937693', '어른의 품위', 'https://image.aladin.co.kr/product/37256/78/cover200/k282031125_1.jpg', '최서영', '북로망스', '에세이'),
  ('9791193044230', '흰 고래의 흼에 대하여', 'https://image.aladin.co.kr/product/35833/49/cover200/k802037766_1.jpg', '홍한별', '위고', '에세이'),
  ('9788934942467', '총 균 쇠', 'https://image.aladin.co.kr/product/31629/43/cover200/8934942460_1.jpg', '재레드 다이아몬드', '김영사', '인문'),
  ('9788936812621', '빅터 프랭클의 죽음의 수용소에서', 'https://image.aladin.co.kr/product/38224/38/cover200/8936812629_1.jpg', '빅터 프랭클', '청아출판사', '에세이'),
  ('9788962622508', '떨림과 울림', 'https://image.aladin.co.kr/product/17299/89/cover200/8962622505_1.jpg', '김상욱', '동아시아', '과학'),
  ('9791189836641', '역제안', 'https://image.aladin.co.kr/product/37615/93/cover200/k572032747_1.jpg', '정재환', '에이플랫', '소설'),
  ('9788925573052', '미술관에서 우리가 놓친 것들', 'https://image.aladin.co.kr/product/37876/24/cover200/8925573059_1.jpg', '윌 곰퍼츠', '알에이치코리아', '인문'),
  ('9791199714502', '계절을 읽는 마음', 'https://image.aladin.co.kr/product/38510/97/cover200/k192135031_2.jpg', '볕뉘', '볕뉘서재', '에세이'),
  ('9788972970293', '우리는 아름답게 어긋나지', 'https://image.aladin.co.kr/product/29093/26/cover200/8972970298_1.jpg', '노지양 , 홍한별', '동녘', '에세이'),
  ('9788960902831', '사라지는 번역자들', 'https://image.aladin.co.kr/product/9588/97/cover200/8960902837_1.jpg', '김남주', '마음산책', '에세이'),
  ('9791164453115', '데미안', 'https://image.aladin.co.kr/product/24943/38/cover200/s522032090_1.jpg', '헤르만 헤세', '더스토리', '소설'),
  ('9788957334010', '부정한 미녀들', 'https://image.aladin.co.kr/product/5364/69/cover200/8957334017_1.jpg', '조르주 무냉', '아카넷', '인문'),
  ('9791186602898', '아무튼, 사전', 'https://image.aladin.co.kr/product/30255/30/cover200/k012839504_1.jpg', '홍한별', '위고', '에세이'),
  ('9788932321547', '오늘의 리듬', 'https://image.aladin.co.kr/product/27457/17/cover200/893232154x_1.jpg', '노지양', '현암사', '에세이'),
  ('9788937477317', '꽤 낙천적인 아이', 'https://image.aladin.co.kr/product/36752/1/cover200/8937477319_3.jpg', '원소윤', '민음사', '소설'),
  ('9788937461033', '인간 실격', 'https://image.aladin.co.kr/product/49/16/cover200/893746103x_3.jpg', '다자이 오사무', '민음사', '소설'),
  ('9791186643204', '혐오의 즐거움에 관하여', 'https://image.aladin.co.kr/product/34406/99/cover200/k832933465_2.jpg', '윌리엄 해즐릿', '아티초크', '에세이'),
  ('9791141609962', '연매장', 'https://image.aladin.co.kr/product/36254/72/cover200/k322038527_1.jpg', '팡팡', '문학동네', '소설'),
  ('9791141614003', '우주의 먼지로부터', 'https://image.aladin.co.kr/product/37835/35/cover200/k102033695_1.jpg', '앨런 타운센드', '문학동네', '에세이'),
  ('9791141601447', '모우어', 'https://image.aladin.co.kr/product/35099/68/cover200/k442934507_1.jpg', '천선란', '문학동네', '소설'),
  ('9788937460586', '싯다르타', 'https://image.aladin.co.kr/product/32/95/cover200/s062934786_1.jpg', '헤르만 헤세', '민음사', '소설'),
  ('9788954609173', '위대한 개츠비', 'https://image.aladin.co.kr/product/596/65/cover200/s542636622_1.jpg', '프랜시스 스콧 피츠제럴드', '문학동네', '소설'),
  ('9788998441012', '모순', 'https://image.aladin.co.kr/product/2584/37/cover200/s392131969_1.jpg', '양귀자', '쓰다', '소설'),
  ('9791173578601', '이향인', 'https://image.aladin.co.kr/product/38793/3/cover200/k292137262_1.jpg', '라미 카민스키', '21세기북스', '인문'),
  ('9788937461767', '괴테와의 대화', 'https://image.aladin.co.kr/product/214/60/cover200/8937461765_2.jpg', '요한 페터 에커만', '민음사', '소설'),
  ('9788937464201', '샤베르 대령', 'https://image.aladin.co.kr/product/31340/24/cover200/8937464209_1.jpg', '오노레 드 발자크', '민음사', '소설'),
  ('9788954677257', '천문학자는 별을 보지 않는다', 'https://image.aladin.co.kr/product/26429/15/cover200/8954677258_2.jpg', '심채경', '문학동네', '과학, 에세이'),
  ('9791191114904', '과학산문', 'https://image.aladin.co.kr/product/37044/68/cover200/k052030130_2.jpg', '김상욱, 심채경', '복복서가', '과학, 에세이'),
  ('9791130646381', '이처럼 사소한 것들', 'https://image.aladin.co.kr/product/32938/68/cover200/k472936042_2.jpg', '클레어 키건', '다산책방', '소설'),
  ('9791130698199', '맡겨진 소녀', 'https://image.aladin.co.kr/product/31555/26/cover200/k832832758_1.jpg', '클레어 키건', '다산책방', '소설'),
  ('9791196820091', '우연의 질병, 필연의 죽음', 'https://image.aladin.co.kr/product/26353/41/cover200/k932730286_2.jpg', '미야노 마키코, 이소노 마호', '다다서재', '에세이, 인문'),
  ('9788936439743', '혼모노', 'https://image.aladin.co.kr/product/39078/47/cover200/k792137959_1.jpg', '성해나', '창비', '소설'),
  ('9791189356514', '아이는 왜 폴렌타 속에서 끓는가', 'https://image.aladin.co.kr/product/26934/35/cover200/k392730718_1.jpg', '아글라야 페터라니', '워크룸프레스', '소설'),
  ('9788983718914', '김상욱의 양자공부', 'https://image.aladin.co.kr/product/11380/16/cover200/s162534273_1.jpg', '김상욱', '사이언스북스', '과학')
) as v(isbn, title, poster_url, author, publisher, genre)
on conflict (isbn) do update set
  title      = coalesce(excluded.title, books.title),
  poster_url = coalesce(excluded.poster_url, books.poster_url),
  author     = coalesce(excluded.author, books.author),
  publisher  = coalesce(excluded.publisher, books.publisher),
  genre      = coalesce(excluded.genre, books.genre);

-- 2) 책 카탈로그 3건 (알라딘 미매칭분). isbn 이 없어 제목+지은이로 중복을 막는다
insert into books (isbn, title, poster_url, author, publisher, genre)
select null, v.title, null, v.author, v.publisher, v.genre
from (values
  ('여행은 늘 나보다 늦게 온다', '예도하', '스튜디오 예도하', '에세이'),
  ('고갱이', '민음북클럽', '민음사', '에세이'),
  ('천녀유혼', '포송령', '민음사', '소설')
) as v(title, author, publisher, genre)
where not exists (
  select 1 from books b where b.title = v.title and b.author is not distinct from v.author
);

-- 3) 완독 기록 51건
insert into records (user_id, category, book_id, title, poster_url,
                     view_start, view_end, status, rating, is_public)
select '3e4756d0-1ee5-4880-aa4f-206547c74d6b'::uuid, 'book', b.id, v.title, b.poster_url,
       v.view_start::date, v.view_end::date, 'done', v.rating, false
from (values
  ('9788901297453', '나는 메트로폴리탄 미술관의 경비원입니다', '2025-03-19', null, 3),
  ('9791191824001', '지구 끝의 온실', '2022-12-15', null, 3.5),
  ('9791197510601', '나의 무섭고 애처로운 환자들', '2023-05-20', null, 4),
  ('9791167900821', '므레모사', '2023-07-13', null, 3.5),
  ('9791168340510', '파친코 1', '2023-07-22', null, 4),
  ('9791168340541', '파친코 2', '2023-07-27', null, 3.5),
  ('9791191114225', '작별인사', '2025-03-21', null, 3.5),
  ('9791198275097', '카프카의 프라하', '2025-09-17', '2025-09-27', 3.5),
  ('9788936439002', '두고 온 여름', '2025-08-21', null, 3.5),
  ('9788954681155', '홍학의 자리', '2025-03-22', null, 3),
  ('9791173741524', '우리는 무엇을 타고나는가', '2025-11-08', '2025-11-26', 3.5),
  ('9791192638461', '영화 보고 오는 길에 글을 썼습니다', '2025-10-21', '2025-10-31', 3.5),
  ('9788925568645', '프로젝트 헤일메리', '2025-11-27', '2025-12-07', 4),
  ('9788954618373', '프랑켄슈타인', '2025-11-01', '2025-11-07', 4),
  ('9791155818831', '해석에 반하여', '2025-12-08', '2025-12-12', 3.5),
  ('9791197325809', '나의 이브 생 로랑에게', '2025-12-13', '2025-12-15', 4),
  ('9791193078563', '토막 난 우주를 안고서', '2025-12-19', '2025-12-24', 3.5),
  ('9791193401583', '최소한의 삼국지', '2026-03-23', '2026-04-03', 4),
  ('9791197325892', '음악소설집', '2025-12-15', '2025-12-18', 4),
  ('9791193937693', '어른의 품위', '2025-12-24', '2025-12-30', 3),
  ('9791193044230', '흰 고래의 흼에 대하여', '2025-12-31', '2026-01-09', 4.5),
  ('9788934942467', '총 균 쇠', '2026-01-08', '2026-02-23', 3.5),
  ('9788936812621', '빅터 프랭클의 죽음의 수용소에서', '2026-01-11', '2026-01-20', 4),
  ('9788962622508', '떨림과 울림', '2026-02-24', '2026-03-06', 4),
  ('9791189836641', '역제안', '2026-03-07', '2026-03-10', 2.5),
  ('9788925573052', '미술관에서 우리가 놓친 것들', '2026-03-12', '2026-03-22', 3),
  ('9791199714502', '계절을 읽는 마음', '2026-03-11', null, 2),
  ('9788972970293', '우리는 아름답게 어긋나지', '2026-03-24', '2026-03-27', 4),
  ('9788960902831', '사라지는 번역자들', '2026-03-28', '2026-04-10', 3.5),
  ('9791164453115', '데미안', '2026-04-11', '2026-04-13', 3.5),
  ('9791186602898', '아무튼, 사전', '2026-04-21', '2026-04-22', 4.5),
  ('9788932321547', '오늘의 리듬', '2026-04-24', '2026-04-29', 4),
  ('9788937477317', '꽤 낙천적인 아이', '2026-04-29', '2026-05-05', 4),
  ('9788937461033', '인간 실격', '2026-05-06', '2026-05-09', 3.5),
  ('9791186643204', '혐오의 즐거움에 관하여', '2026-05-09', '2026-05-15', 3),
  ('9791141609962', '연매장', '2026-05-16', '2026-05-26', 5),
  ('9791141614003', '우주의 먼지로부터', '2026-05-27', '2026-06-10', 2.5),
  ('9791141601447', '모우어', '2026-06-02', '2026-06-08', 3),
  ('9788937460586', '싯다르타', '2026-06-11', '2026-06-16', 3.5),
  ('9788954609173', '위대한 개츠비', '2026-06-17', '2026-06-23', 3.5),
  ('9788998441012', '모순', '2026-06-24', '2026-06-29', 4),
  ('9791173578601', '이향인', '2026-07-01', '2026-07-04', 2.5),
  ('9788937461767', '괴테와의 대화', '2026-07-06', '2026-07-09', 3),
  ('9788937464201', '샤베르 대령', '2026-07-13', '2026-07-14', 3),
  ('9788954677257', '천문학자는 별을 보지 않는다', '2026-07-14', '2026-07-23', 3.5),
  ('9791191114904', '과학산문', '2026-07-23', '2026-07-29', 3.5),
  ('9791130646381', '이처럼 사소한 것들', '2026-07-30', '2026-07-31', 4),
  ('9791130698199', '맡겨진 소녀', '2026-08-01', '2026-08-04', 3.5),
  ('9791196820091', '우연의 질병, 필연의 죽음', '2026-08-05', '2026-08-08', 3.5),
  ('9788936439743', '혼모노', '2026-08-10', '2026-08-13', 4),
  ('9791189356514', '아이는 왜 폴렌타 속에서 끓는가', '2026-09-02', '2026-09-04', 3)
) as v(isbn, title, view_start, view_end, rating)
join books b on b.isbn = v.isbn
where not exists (
  select 1 from records r
  where r.user_id = '3e4756d0-1ee5-4880-aa4f-206547c74d6b'::uuid
    and r.category = 'book'
    and r.book_id = b.id
    and r.view_start is not distinct from v.view_start::date
);

-- 4) 읽는 중 2건
insert into records (user_id, category, book_id, title, poster_url,
                     view_start, view_end, status, rating, is_public)
select '3e4756d0-1ee5-4880-aa4f-206547c74d6b'::uuid, 'book', b.id, v.title, b.poster_url,
       v.view_start::date, v.view_end::date, 'in_progress', v.rating, false
from (values
  ('9788957334010', '부정한 미녀들', '2026-04-15', null, null),
  ('9788983718914', '김상욱의 양자공부', '2026-09-07', null, null)
) as v(isbn, title, view_start, view_end, rating)
join books b on b.isbn = v.isbn
where not exists (
  select 1 from records r
  where r.user_id = '3e4756d0-1ee5-4880-aa4f-206547c74d6b'::uuid
    and r.category = 'book'
    and r.book_id = b.id
    and r.view_start is not distinct from v.view_start::date
);

-- 5) 완독 기록 (isbn 없는 책) 3건
insert into records (user_id, category, book_id, title, poster_url,
                     view_start, view_end, status, rating, is_public)
select '3e4756d0-1ee5-4880-aa4f-206547c74d6b'::uuid, 'book', b.id, v.title, b.poster_url,
       v.view_start::date, v.view_end::date, 'done', v.rating, false
from (values
  ('여행은 늘 나보다 늦게 온다', '여행은 늘 나보다 늦게 온다', '2026-05-15', '2026-05-16', 3.5),
  ('고갱이', '고갱이', '2026-08-25', '2026-08-27', 3),
  ('천녀유혼', '천녀유혼', '2026-08-28', '2026-09-01', 3)
) as v(book_title, title, view_start, view_end, rating)
join books b on b.title = v.book_title and b.isbn is null
where not exists (
  select 1 from records r
  where r.user_id = '3e4756d0-1ee5-4880-aa4f-206547c74d6b'::uuid
    and r.category = 'book'
    and r.book_id = b.id
    and r.view_start is not distinct from v.view_start::date
);

commit;
