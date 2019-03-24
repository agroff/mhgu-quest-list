let navOpen = false;
$(function(){
    let $nav = $("#navMenu");
    $(".navbar-nav a").click(function(){
        if(navOpen){
            $nav.hide();
            navOpen = false;
        }
        else {
            $nav.show();
            navOpen = true;
        }
    });

    $("html").click(function(event){
        const inMenu = $(event.target).closest('#navMenu, .navbar-nav').length > 0;
        if(inMenu){
            return;
        }
        if(navOpen){
            $nav.hide();
            navOpen = false;
        }
    });
});