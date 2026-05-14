export default defineEventHandler((event) => {
  const csv = [
    "flown_at,flight_number,from_airport,to_airport,cabin,fare_type,pp,aircraft,seat,lounge,rating_seat,rating_aircraft,rating_lounge,notes",
    "2026-04-10,NH256,HND,FUK,economy,standard,,B787-9,12A,ANA LOUNGE 羽田,4,5,4,午前便でスムーズ",
    "2026-04-12,NH257,FUK,HND,first,simple,,B787-9,1A,,5,5,,",
    "2026-05-03,NH463,HND,OKA,economy,standard,,A321neo,28K,,3,4,,",
    "2026-05-05,NH468,OKA,HND,economy,standard,,B777-200,42A,ANA LOUNGE 那覇,3,4,4,離島から戻り",
    "",
  ].join("\n");

  setHeader(event, "content-type", "text/csv; charset=utf-8");
  setHeader(
    event,
    "content-disposition",
    'attachment; filename="ana-pp-sample.csv"',
  );
  // BOM for Excel
  return "﻿" + csv;
});
