gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText);

ScrollSmoother.create({
    wrapper: "#smooth-wrapper",
    content: "#smooth-content",
    smooth: 4,
    effects: true,
});

let isShortHeight = window.screen.height < 1050;

ScrollTrigger.matchMedia({
    "(min-width: 991px)": function () {
        // Animation for headphone
        gsap.to('#headphone', {
            scrollTrigger: {
                trigger: '#section2',
                start: 'top bottom',
                end: 'center center',
                scrub: true,
            },
            y: '85vh',
            x: '35vw',
            scale: 0.8,
            rotate: 90,
            ease: 'power1.inOut',
            immediateRender: false
        });

        // Animation for drinks section heading
        gsap.from('#section3 .heading', {
            scrollTrigger: {
                trigger: '#section3',
                start: 'top bottom',
                end: 'center bottom',
                scrub: true,
            },
            y: '140%',
            ease: 'power1.inOut',
        });

        // Animation for drinks section text and button
        gsap.from('#section3 .juice-text p, #section3 .juice-text .btn', {
            scrollTrigger: {
                trigger: '#section3',
                start: 'top bottom',
                end: 'center bottom',
                scrub: true,
            },
            y: '140%',
            ease: 'power1.inOut',
            stagger: 0.1
        });

        // Animation for donuts section image
        gsap.from('#section2 img', {
            scrollTrigger: {
                trigger: '#section2',
                start: 'top bottom',
                end: 'center center',
                scrub: true,
            },
            width: 0,
            opacity: 0,
            ease: 'power1.inOut',
        });

        // Animation for intro section heading
        let split = SplitText.create('#section1 .heading', {
            type: 'chars, words, lines',
            mask: 'lines'
        });

        gsap.from(split.chars, {
            yPercent: () => gsap.utils.random(-100, 100),
            rotation: () => gsap.utils.random(-30, 30),
            autoAlpha: 0,
            ease: 'back.out(1.5)',
            stagger: {
                amount: 0.5,
                from: 'random'
            },
            duration: 1.5
        });

        // Initial headphone animation
        gsap.from('#headphone', {
            opacity: 0,
            scale: 0,
            duration: 1,
            delay: 1,
            ease: 'power1.inOut'
        });
    }
});

// Animations for cookies (removed rotationY and scale, kept opacity and position animations)
gsap.from('.product-img-wrapper .product1', {
    scrollTrigger: {
        trigger: '#section4',
        start: 'top 80%',
        toggleActions: 'play none none reverse'
    },
    opacity: 0,
    x: -500,
    duration: 1.5
});

gsap.from('.product-img-wrapper .product2', {
    scrollTrigger: {
        trigger: '#section4',
        start: 'top 80%',
        toggleActions: 'play none none reverse'
    },
    opacity: 0,
    y: 300,
    duration: 1.5
});

gsap.from('.product-img-wrapper .product3', {
    scrollTrigger: {
        trigger: '#section4',
        start: 'top 80%',
        toggleActions: 'play none none reverse'
    },
    opacity: 0,
    x: 500,
    duration: 1.5
});
// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// Animate the whole Nav bar on load
gsap.from(".nav", {
    y: -50,
    opacity: 0,
    duration: 1,
    ease: "power3.out"
});
// To this:
gsap.from(".juice-text", {
    x: -50, // Moves it slightly from the left instead of pushing it right
    opacity: 0,
    duration: 1
});
// Specifically pop the Login button at the end
gsap.from(".nav-login-btn", {
    scale: 0,
    opacity: 0,
    duration: 0.8,
    delay: 0.8,
    ease: "back.out(1.7)"
});
// Removed 3D hover effect event listeners for cookies

// Login button update is now handled by navigation.js