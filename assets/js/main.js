/*
	Modern Resume Website
	Enhanced navigation and smooth interactions
*/

(function($) {

	var $window = $(window),
		$body = $('body'),
		$header = $('#header'),
		$nav = $('#nav'),
		$main = $('#main');

	// Breakpoints
	breakpoints({
		xlarge:   [ '1281px',  '1680px' ],
		large:    [ '1025px',  '1280px' ],
		medium:   [ '737px',   '1024px' ],
		small:    [ '481px',   '736px'  ],
		xsmall:   [ null,      '480px'  ],
	});

	// Remove preload class on page load
	$window.on('load', function() {
		window.setTimeout(function() {
			$body.removeClass('is-preload');
		}, 100);
	});

	// Smooth scroll for navigation links
	$nav.find('.nav-link').on('click', function(e) {
		var href = $(this).attr('href');
		
		// Only handle internal links
		if (href.charAt(0) === '#') {
			e.preventDefault();
			
			// Remove active class from all nav links
			$nav.find('.nav-link').removeClass('active');
			
			// Add active class to clicked link
			$(this).addClass('active');
			
			// Smooth scroll to target
			var target = $(href);
			if (target.length) {
				$('html, body').animate({
					scrollTop: target.offset().top - 20
				}, 800, 'swing');
			}
		}
	});

	// Update active navigation on scroll
	$window.on('scroll', function() {
		var scrollPos = $window.scrollTop() + 100;
		
		// Check each section
		$('.section').each(function() {
			var $this = $(this),
				top = $this.offset().top,
				bottom = top + $this.outerHeight(),
				id = $this.attr('id');
			
			if (scrollPos >= top && scrollPos <= bottom) {
				// Remove active class from all nav links
				$nav.find('.nav-link').removeClass('active');
				
				// Add active class to corresponding nav link
				$nav.find('a[href="#' + id + '"]').addClass('active');
			}
		});
	});

	// Add animation classes when elements come into view
	function animateOnScroll() {
		$('.timeline-item, .skill-category, .education-item, .stat').each(function() {
			var $this = $(this),
				elementTop = $this.offset().top,
				elementBottom = elementTop + $this.outerHeight(),
				viewportTop = $window.scrollTop(),
				viewportBottom = viewportTop + $window.height();
			
			if (elementBottom > viewportTop && elementTop < viewportBottom) {
				$this.addClass('animate-in');
			}
		});
	}

	// Animate skill bars when they come into view
	function animateSkillBars() {
		$('.skill-progress').each(function() {
			var $this = $(this),
				$container = $this.closest('.skill-category'),
				containerTop = $container.offset().top,
				containerBottom = containerTop + $container.outerHeight(),
				viewportTop = $window.scrollTop(),
				viewportBottom = viewportTop + $window.height();
			
			if (containerBottom > viewportTop && containerTop < viewportBottom) {
				if (!$this.hasClass('animated')) {
					var width = $this.css('width');
					$this.css('width', '0%').animate({
						width: width
					}, 1500, 'easeOutCubic').addClass('animated');
				}
			}
		});
	}

	// Counter animation for stats
	function animateCounters() {
		$('.stat h3').each(function() {
			var $this = $(this),
				$container = $this.closest('.stat'),
				containerTop = $container.offset().top,
				containerBottom = containerTop + $container.outerHeight(),
				viewportTop = $window.scrollTop(),
				viewportBottom = viewportTop + $window.height();
			
			if (containerBottom > viewportTop && containerTop < viewportBottom) {
				if (!$this.hasClass('counted')) {
					var text = $this.text(),
						hasPlus = text.includes('+'),
						number = parseInt(text.replace(/\D/g, ''));
					
					if (!isNaN(number)) {
						$this.addClass('counted');
						$({ count: 0 }).animate({ count: number }, {
							duration: 2000,
							easing: 'swing',
							step: function() {
								$this.text(Math.floor(this.count) + (hasPlus ? '+' : ''));
							},
							complete: function() {
								$this.text(text);
							}
						});
					}
				}
			}
		});
	}

	// Run animations on scroll
	$window.on('scroll', function() {
		animateOnScroll();
		animateSkillBars();
		animateCounters();
	});

	// Run animations on page load
	$window.on('load', function() {
		animateOnScroll();
		animateSkillBars();
		animateCounters();
	});

	// Mobile navigation toggle (for smaller screens)
	breakpoints.on('<=medium', function() {
		// Add mobile navigation behavior if needed
		$header.addClass('mobile');
	});

	breakpoints.on('>medium', function() {
		$header.removeClass('mobile');
	});

	// Add hover effects for project tech items
	$('.tech-item').on('mouseenter', function() {
		$(this).css('transform', 'scale(1.05)');
	}).on('mouseleave', function() {
		$(this).css('transform', 'scale(1)');
	});

	// Add typing effect to the title (optional enhancement)
	function typeWriter(element, text, speed = 100) {
		let i = 0;
		element.innerHTML = '';
		
		function type() {
			if (i < text.length) {
				element.innerHTML += text.charAt(i);
				i++;
				setTimeout(type, speed);
			}
		}
		
		type();
	}

	// Initialize typing effect on page load
	$window.on('load', function() {
		const titleElement = document.querySelector('.profile-info .title');
		if (titleElement) {
			const originalText = titleElement.textContent;
			setTimeout(() => {
				typeWriter(titleElement, originalText, 80);
			}, 1000);
		}
	});

	// Parallax effect for background elements
	$window.on('scroll', function() {
		var scrolled = $window.scrollTop();
		var parallax = scrolled * 0.5;
		
		$('.about-image').css('transform', 'translateY(' + parallax + 'px)');
	});

	// Add particle effect to header (optional)
	function createParticles() {
		const header = document.getElementById('header');
		if (!header) return;
		
		for (let i = 0; i < 50; i++) {
			const particle = document.createElement('div');
			particle.className = 'particle';
			particle.style.cssText = `
				position: absolute;
				width: 2px;
				height: 2px;
				background: rgba(37, 99, 235, 0.3);
				border-radius: 50%;
				pointer-events: none;
				left: ${Math.random() * 100}%;
				top: ${Math.random() * 100}%;
				animation: float ${3 + Math.random() * 4}s ease-in-out infinite;
				animation-delay: ${Math.random() * 2}s;
			`;
			header.appendChild(particle);
		}
	}

	// Add CSS for particle animation
	const style = document.createElement('style');
	style.textContent = `
		@keyframes float {
			0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.3; }
			50% { transform: translateY(-20px) rotate(180deg); opacity: 0.7; }
		}
		
		.animate-in {
			animation: slideInUp 0.6s ease-out forwards;
		}
		
		@keyframes slideInUp {
			from {
				opacity: 0;
				transform: translateY(30px);
			}
			to {
				opacity: 1;
				transform: translateY(0);
			}
		}
	`;
	document.head.appendChild(style);

	// Initialize particles
	$window.on('load', function() {
		createParticles();
	});

})(jQuery);