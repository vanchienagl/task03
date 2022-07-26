// Detect mobile
function isMobile(){
  var isMobile = (/iphone|ipod|android|ie|blackberry|fennec/).test(navigator.userAgent.toLowerCase());
  return isMobile;
}

// Toogle menu
window.addEventListener("load", function () {
  const toggle = document.querySelector(".c-header__iconmenu");
  const toggleClose = document.querySelector(".c-header__iconmenu--close");
  const menu = document.querySelector(".c-header__menu");
  toggle && toggle.addEventListener("click", handleToggleMenu);
  toggleClose && toggleClose.addEventListener("click", handleClickOutside);
  function handleToggleMenu() {
    menu && menu.classList.add("is-show");
  }
  function handleClickOutside(e) {
    if (e.target.matches(".c-header__iconmenu") || e.target.matches(".c-header__menu--list, .c-header__menu--list *"))
      return;
      menu && menu.classList.remove("is-show");
  }
});

$('.c-header__menu--link').click(function(){
  $('.c-header__menu').removeClass('is-show')
});

$('.c-header__iconmenu').click(function(){
  $("body").css({"overflow":"hidden"});
});

$('.c-header__iconmenu--close').click(function(){
  $("body").css({"overflow":"visible"});
});


// List Points
$('.p-points__image--more').click(function(){
  var itemCurrent = $(this).parent('.p-points__item');
  itemCurrent.find('.p-points__itemcontent').fadeIn(200).addClass('is-active');
  itemCurrent.siblings('.p-points__item').find('.p-points__itemcontent').fadeOut(100).removeClass('is-active');
});

// List Posts
if(isMobile() || window.innerWidth < 767){
  $('.p-posts__link').hide();
  $('.p-posts__link--top').show();

  $('.p-posts__arrow').click(function(){
    var postItemCurrent = $(this).parents('.p-posts__item');
    var postMediaCurrent = postItemCurrent.find('.p-posts__media');
    var postTextCurrent = postItemCurrent.find('.p-posts__text');
    var postArowCurrent = postItemCurrent.find('.p-posts__arrow');
    postTextCurrent.slideToggle();
    postArowCurrent.toggleClass('is-active');
    postMediaCurrent.toggleClass('is-active');

    if(postArowCurrent.hasClass('is-active')){
      postItemCurrent.find('.p-posts__link').show();
    }else{
      postItemCurrent.find('.p-posts__link').hide();
    }
  });
}

//Animation when scroll mouse
$(window).scroll(function() {
  if ($(this).scrollTop() > 5) {
    $('.p-mvisual__bubblelist').addClass('is-active');
    $('.c-header__leaf--tl').addClass('is-active');
    $('.c-header__leaf--tr').addClass('is-active');
  } else {
    $('.p-mvisual__bubblelist').removeClass('is-active');
    $('.c-header__leaf--tl').removeClass('is-active');
    $('.c-header__leaf--tr').removeClass('is-active');
  }
});

// Fix scroll smooth in IE11
var isIE11 = !!window.MSInputMethodContext && !!document.documentMode;
if(isIE11){
  $(document).ready(function() {
    $(".c-header__menu--link").on('click', function(event) {
      if (this.hash !== "") {
        event.preventDefault();
        var hash = this.hash;
        $('html,body').animate({
          scrollTop: $(hash).offset().top
        }, 1200, function() {
          window.location.hash = hash;
        });
      }
    });
  });
}