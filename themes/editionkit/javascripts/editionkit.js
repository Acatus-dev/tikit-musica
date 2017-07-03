if (!EditionKit) {
    var EditionKit = {};
}

(function ($) {
    
    EditionKit.mobileSelectNav = function () {
        // Create the dropdown base
        $("<select class=\"mobile\" />").appendTo("nav.top");
        
        // Create default option "Go to..."
        $("<option />", {
           "selected": "selected",
           "value"   : "",
           "text"    : "Go to..."
        }).appendTo("nav select");
        
        // Populate dropdown with menu items
        $("nav.top a").each(function() {
            var el = $(this);
            if (el.parents('ul ul').length) {
                var parentCount = el.parents("ul").length;
                var dashes = new Array(parentCount).join('- ');
                $("<option />", {
                    "value": el.attr("href"),
                    "text":  dashes + el.text()
                }).appendTo("nav select");
            } else {
                $("<option />", {
                    "value": el.attr("href"),
                    "text": el.text()
                }).appendTo("nav.top select");
            }
            $("nav.top select").change(function() {
              window.location = $(this).find("option:selected").val();
            });
        });
    }

})(jQuery);

jQuery(document).ready(function($){
        $('#top-nav').click('.nav-item > a', function(e){
            if(Modernizr.touch && $(e.toElement).closest('li').hasClass('nav-item') && !$(e.toElement).closest('li').is(':last-child')){
                e.preventDefault();
            }
        });
});