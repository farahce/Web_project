gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText);

ScrollSmoother.create({
    wrapper: "#smooth-wrapper",
    content: "#smooth-content",
    smooth: 5,
    effects: true,
});

// Temporarily disable card animations to test alignment
ScrollTrigger.matchMedia({
    "(min-width: 991px)": function () {
        // Animation for page heading
        gsap.from('.page-heading', {
            scrollTrigger: {
                trigger: '.cookie-page',
                start: 'top 75%',
                toggleActions: 'play none none reverse'
            },
            opacity: 0,
            y: 40,
            scale: 0.9,
            duration: 1.2,
            ease: 'power3.out'
        });

        // Animation for page intro
        gsap.from('.page-intro', {
            scrollTrigger: {
                trigger: '.cookie-page',
                start: 'top 75%',
                toggleActions: 'play none none reverse'
            },
            opacity: 0,
            y: 30,
            duration: 1.2,
            delay: 0.3,
            ease: 'power3.out'
        });
    }
});

// Add to Cart button animation and effect
const addToCartButtons = document.querySelectorAll('.add-to-cart');
addToCartButtons.forEach(button => {
    button.addEventListener('click', () => {
        gsap.to(button, {
            scale: 0.95,
            duration: 0.1,
            yoyo: true,
            repeat: 1,
            ease: 'power1.inOut'
        });
        gsap.fromTo(button, {
            background: 'linear-gradient(135deg, #8A4B2F, #6D3A25)'
        }, {
            background: 'linear-gradient(135deg, #6D3A25, #5A2F1F)',
            duration: 0.2,
            yoyo: true,
            repeat: 1
        });
        alert('Added to cart!'); // Placeholder for cart functionality
    });

    button.addEventListener('mouseenter', () => {
        gsap.to(button, {
            boxShadow: '0 6px 15px rgba(138, 75, 47, 0.4)',
            duration: 0.3,
            ease: 'power1.out'
        });
    });

    button.addEventListener('mouseleave', () => {
        gsap.to(button, {
            boxShadow: '0 4px 12px rgba(138, 75, 47, 0.2)',
            duration: 0.3,
            ease: 'power1.out'
        });
    });
});

// Parallax effect for images
gsap.utils.toArray('.cookie-img').forEach(image => {
    gsap.to(image, {
        y: 20,
        ease: "none",
        scrollTrigger: {
            trigger: image,
            scrub: 0.5
        }
    });
});