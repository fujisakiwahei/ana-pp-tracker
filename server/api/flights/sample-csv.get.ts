export default defineEventHandler((event) => {
  const csv = [
    "flown_at,flight_number,from_airport,to_airport,cabin,fare_type,pp,aircraft,seat,lounge,rating_seat,rating_aircraft,rating_lounge,notes",
    "2026-04-10,NH256,HND,FUK,economy,simple,,,,,,,,",
    "2026-04-12,NH257,FUK,HND,first,simple,,,,,,,,",
    "2026-05-20,NH985,HND,OKA,first,standard,,,,,,,,",
    "2026-05-22,NH984,OKA,HND,economy,simple,,,,,,,,",
    "",
  ].join("\n");

  setHeader(event, "content-type", "text/csv; charset=utf-8");
  setHeader(
    event,
    "content-disposition",
    'attachment; filename="ana-pp-sample.csv"',
  );
  // Excel で開いたときに文字化けしないよう BOM を先頭に付ける。
  return "\uFEFF" + csv;
});
