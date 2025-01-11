
//   // navbar start here 
//   const hamburger = document.querySelector(".nav-burger");
//   const remove = document.querySelector(".close-nav");
//   const navContainer = document.querySelector(".mobile-navbar");


// // Toggle the active class
// hamburger.addEventListener("click", () => {
//   hamburger.classList.toggle("active");
//   navContainer.classList.toggle("active");
// });

// if (hamburger) {
//   hamburger.addEventListener("click", () => {
//     hamburger.classList.toggle("active");
//     navContainer.classList.toggle("active");
//   });
// }

//   //  for top scroll navbar 
//   window.addEventListener("scroll", ()=>{
//     if (document.documentElement.scrollTop > 20) {
//       document.querySelector(".scroll-nav").style.top = "0";
//     } else {
//       document.querySelector(".scroll-nav").style.top = "-80px";
//     }
//   });

//   document.addEventListener("DOMContentLoaded", function () {
//     const toTop = document.querySelector(".to-top");

//     window.addEventListener("scroll", () => {
//         if (window.scrollY > 100) {
//             toTop.classList.add("active");
//         } else {
//             toTop.classList.remove("active");
//         }
//     });

//     toTop.addEventListener("click", (e) => {
//         e.preventDefault(); // Prevent default anchor behavior
//         window.scrollTo({
//             top: 0,
//             behavior: "smooth"
//         });
//     });
// });






// // <!-- scroll navbar end here  -->



// navbar start here 
const hamburger = document.querySelector(".nav-burger");
const remove = document.querySelector(".close-nav");
const navContainer = document.querySelector(".mobile-navbar");

// Toggle the active class
hamburger.addEventListener("click", () => {
  hamburger.classList.toggle("active");
  navContainer.classList.toggle("active");
});

// Scroll Navbar
window.addEventListener("scroll", () => {
  if (document.documentElement.scrollTop > 20) {
    document.querySelector(".scroll-nav").style.top = "0";
  } else {
    document.querySelector(".scroll-nav").style.top = "-80px";
  }
});

// Bottom-to-Top Scroll Button
document.addEventListener("DOMContentLoaded", function () {
  const toTop = document.querySelector(".to-top");

  window.addEventListener("scroll", () => {
    if (window.scrollY > 100) {
      toTop.classList.add("active");
    } else {
      toTop.classList.remove("active");
    }
  });

  toTop.addEventListener("click", (e) => {
    e.preventDefault(); // Prevent default anchor behavior
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });

  // Animated Text Script
  const animatedTextElements = document.querySelectorAll(".animated-text");
  if (animatedTextElements.length > 0) {
    let index = 0;

    setInterval(() => {
      animatedTextElements.forEach((el, i) => {
        el.style.transform = `translateY(${i === index ? 0 : 100}%)`;
        el.style.opacity = i === index ? 1 : 0;
      });
      index = (index + 1) % animatedTextElements.length;
    }, 2000); // Change duration for cycling through words
  }
});
