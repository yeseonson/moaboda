-- KOPIS 는 명단이 더 있을 때 마지막 이름 뒤에 "등" 을 붙여 보낸다 ("한보라 등").
-- 콤마로만 잘라 저장하는 바람에 이름에 붙어버린 것을 떼어낸다.
--
-- 실행 전 확인:
--   select count(*) from performances where exists (
--     select 1 from unnest("cast") e where e ~ '\s등$');

begin;

-- 공연 카탈로그 (KOPIS 에서 가져온 전체 출연진)
update performances
set "cast" = sub.cleaned
from (
  select
    p.id,
    array_agg(trim(regexp_replace(e.name, '\s+등$', '')) order by e.ord) as cleaned
  from performances p
  cross join lateral unnest(p."cast") with ordinality as e(name, ord)
  where p."cast" is not null
    and trim(regexp_replace(e.name, '\s+등$', '')) <> ''
  group by p.id
) as sub
where performances.id = sub.id
  and exists (
    select 1 from unnest(performances."cast") x where x ~ '\s등$' or x = '등'
  );

-- 관람 기록의 출연진 (그날 본 배우). Notion 임포트분은 보통 깨끗하지만
-- 앱에서 카탈로그 값을 복사해 저장한 경우가 있을 수 있어 함께 정리한다.
update records
set "cast" = sub.cleaned
from (
  select
    r.id,
    array_agg(trim(regexp_replace(e.name, '\s+등$', '')) order by e.ord) as cleaned
  from records r
  cross join lateral unnest(r."cast") with ordinality as e(name, ord)
  where r."cast" is not null
    and trim(regexp_replace(e.name, '\s+등$', '')) <> ''
  group by r.id
) as sub
where records.id = sub.id
  and exists (
    select 1 from unnest(records."cast") x where x ~ '\s등$' or x = '등'
  );

commit;

-- 실행 후 확인 (0 이어야 한다):
--   select
--     (select count(*) from performances where exists (select 1 from unnest("cast") e where e ~ '\s등$')) as 공연,
--     (select count(*) from records      where exists (select 1 from unnest("cast") e where e ~ '\s등$')) as 기록;
