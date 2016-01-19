tim={
  start: 1
};

tim.$details = (function() {
  return $(".film-detail-content");
})();


tim.data=(function() {
  dd=[];
  $.each(tim.$details, function(i, o){
    $o=$(o);
    h=$o.find("h2");
    t=h.find("a").html();
    y=h.find("small a").html();
    r=$o.find("meta[itemprop='rating']").attr("content");
    dd.push({
      rank:i+tim.start,
      title:t,
      year:y,
      rating:r
    });
  });

  return dd;
})();

tim.display=function() {
  m="";
  $.each(tim.data, function (i,o) {
    m+=o.rank + ". " + o.title + " " + "(" + o.year + ") [" + o.rating + "/10]\n";
  });
  console.log(m);
};