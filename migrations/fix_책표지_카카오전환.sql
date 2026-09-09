-- 책 표지를 알라딘에서 카카오(다음 북)로 교체
-- 생성일: 2026-09-09
-- 알라딘 OpenAPI 가 2026-10-30 에 종료된다. 이미지 CDN 은 별개라 당장 깨지진 않겠지만
-- 같이 내려갈 수 있어 미리 옮긴다. 덤으로 표지가 커진다 (알라딘 cover200 -> 458x638).
-- ISBN 으로 조회해 찾은 52건을 바꾼다. 카카오에 없는 1건(프로젝트 헤일메리)은 2번에서 따로 처리한다.
-- 앱에서 직접 등록한 책은 여기 없다. 남아 있는지 확인은 README 참고.

begin;

-- 1) 카탈로그 표지 52건
update books set poster_url = v.url
from (values
  ('9788901297453', 'https://t1.daumcdn.net/lbook/image/7028009?timestamp=20260703151338'),
  ('9791191824001', 'https://t1.daumcdn.net/lbook/image/5807997?timestamp=20260708122658'),
  ('9791197510601', 'https://t1.daumcdn.net/lbook/image/5793330?timestamp=20250109144513'),
  ('9791167900821', 'https://t1.daumcdn.net/lbook/image/5928445?timestamp=20260705124422'),
  ('9791168340510', 'https://t1.daumcdn.net/lbook/image/6117506?timestamp=20250828141606'),
  ('9791168340541', 'https://t1.daumcdn.net/lbook/image/6136185?timestamp=20250601124803'),
  ('9791191114225', 'https://t1.daumcdn.net/lbook/image/6056307?timestamp=20260403152244'),
  ('9791198275097', 'https://t1.daumcdn.net/lbook/image/6736390?timestamp=20250827142517'),
  ('9788936439002', 'https://t1.daumcdn.net/lbook/image/6306864?timestamp=20260807155318'),
  ('9788954681155', 'https://t1.daumcdn.net/lbook/image/5796992?timestamp=20260605121529'),
  ('9791173741524', 'https://t1.daumcdn.net/lbook/image/7020819?timestamp=20251118152834'),
  ('9791192638461', 'https://t1.daumcdn.net/lbook/image/6719714?timestamp=20240912080838'),
  ('9788954618373', 'https://t1.daumcdn.net/lbook/image/691137?timestamp=20260307110823'),
  ('9791155818831', 'https://t1.daumcdn.net/lbook/image/7098735?timestamp=20251230152018'),
  ('9791197325809', 'https://t1.daumcdn.net/lbook/image/5594329?timestamp=20260411120305'),
  ('9791193078563', 'https://t1.daumcdn.net/lbook/image/6930633?timestamp=20250910144157'),
  ('9791193401583', 'https://t1.daumcdn.net/lbook/image/7076425?timestamp=20260708123826'),
  ('9791197325892', 'https://t1.daumcdn.net/lbook/image/6669700?timestamp=20260116150904'),
  ('9791193937693', 'https://t1.daumcdn.net/lbook/image/7038170?timestamp=20260704121831'),
  ('9791193044230', 'https://t1.daumcdn.net/lbook/image/6844228?timestamp=20260104123524'),
  ('9788934942467', 'https://t1.daumcdn.net/lbook/image/6346070?timestamp=20260108152003'),
  ('9788936812621', 'https://t1.daumcdn.net/lbook/image/7111538?timestamp=20260401124425'),
  ('9788962622508', 'https://t1.daumcdn.net/lbook/image/4366516?timestamp=20260611113955'),
  ('9791189836641', 'https://t1.daumcdn.net/lbook/image/7068385?timestamp=20251112153549'),
  ('9788925573052', 'https://t1.daumcdn.net/lbook/image/7083029?timestamp=20260206151104'),
  ('9791199714502', 'https://t1.daumcdn.net/lbook/image/7144414?timestamp=20260821123626'),
  ('9788972970293', 'https://t1.daumcdn.net/lbook/image/6033697?timestamp=20221011184026'),
  ('9788960902831', 'https://t1.daumcdn.net/lbook/image/841384?timestamp=20220804184324'),
  ('9791164453115', 'https://t1.daumcdn.net/lbook/image/5449693?timestamp=20260815134554'),
  ('9788957334010', 'https://t1.daumcdn.net/lbook/image/757113?timestamp=20221025130520'),
  ('9791186602898', 'https://t1.daumcdn.net/lbook/image/6180544?timestamp=20250521220556'),
  ('9788932321547', 'https://t1.daumcdn.net/lbook/image/5757995?timestamp=20221003230025'),
  ('9788937477317', 'https://t1.daumcdn.net/lbook/image/6964113?timestamp=20251108151703'),
  ('9788937461033', 'https://t1.daumcdn.net/lbook/image/540869?timestamp=20260826111033'),
  ('9791186643204', 'https://t1.daumcdn.net/lbook/image/6715745?timestamp=20250521221724'),
  ('9791141609962', 'https://t1.daumcdn.net/lbook/image/6893954?timestamp=20260822122644'),
  ('9791141614003', 'https://t1.daumcdn.net/lbook/image/7082077?timestamp=20260427121227'),
  ('9791141601447', 'https://t1.daumcdn.net/lbook/image/6760908?timestamp=20260410121645'),
  ('9788937460586', 'https://t1.daumcdn.net/lbook/image/540824?timestamp=20260826111024'),
  ('9788954609173', 'https://t1.daumcdn.net/lbook/image/690408?timestamp=20260207110832'),
  ('9788998441012', 'https://t1.daumcdn.net/lbook/image/1500252?timestamp=20260624111141'),
  ('9791173578601', 'https://t1.daumcdn.net/lbook/image/7173461?timestamp=20260414121747'),
  ('9788937461767', 'https://t1.daumcdn.net/lbook/image/540942?timestamp=20260201110615'),
  ('9788937464201', 'https://t1.daumcdn.net/lbook/image/6312840?timestamp=20251217151936'),
  ('9788954677257', 'https://t1.daumcdn.net/lbook/image/5602641?timestamp=20260131142245'),
  ('9791191114904', 'https://t1.daumcdn.net/lbook/image/7008334?timestamp=20260425122714'),
  ('9791130646381', 'https://t1.daumcdn.net/lbook/image/6500196?timestamp=20250423154319'),
  ('9791130698199', 'https://t1.daumcdn.net/lbook/image/6336898?timestamp=20240416170234'),
  ('9791196820091', 'https://t1.daumcdn.net/lbook/image/5624785?timestamp=20260116142504'),
  ('9788936439743', 'https://t1.daumcdn.net/lbook/image/6873361?timestamp=20260904122807'),
  ('9791189356514', 'https://t1.daumcdn.net/lbook/image/5641437?timestamp=20260317121738'),
  ('9788983718914', 'https://t1.daumcdn.net/lbook/image/1167137?timestamp=20260411110723')
) as v(isbn, url)
where books.isbn = v.isbn
  and books.poster_url is distinct from v.url;

-- 2) 프로젝트 헤일메리만 따로. 지금 들고 있는 isbn 이 알라딘 리커버 특별판이라
--    카카오에서 조회되지 않는다. 앞으로 검색되는 일반판 isbn 으로 바꾸고 표지도 채운다.
--    (일반판 행이 이미 있으면 유니크 제약에 걸리므로 없을 때만 바꾼다)
update books
set isbn = '9788925588735',
    poster_url = 'https://t1.daumcdn.net/lbook/image/5661554?timestamp=20260410120450'
where isbn = '9788925568645'
  and not exists (select 1 from books b2 where b2.isbn = '9788925588735');

-- 3) 기록에 복사돼 있는 표지도 카탈로그에 맞춘다.
--    알라딘 주소인 것만 건드려서, 직접 넣은 표지는 남긴다.
update records r set poster_url = b.poster_url
from books b
where r.book_id = b.id
  and r.category = 'book'
  and r.poster_url like '%aladin%'
  and r.poster_url is distinct from b.poster_url;

commit;
