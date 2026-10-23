// Плавающие сердечки на фоне + конфетти на странице «Да»
(function () {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const symbols = ['❤', '💖', '💕', '💗', '🌸'];

    function spawnHeart() {
        const h = document.createElement('span');
        h.className = 'heart';
        h.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        const dur = 7 + Math.random() * 7;
        h.style.left = Math.random() * 100 + 'vw';
        h.style.fontSize = 14 + Math.random() * 22 + 'px';
        h.style.opacity = 0.35 + Math.random() * 0.4;
        h.style.animationDuration = dur + 's';
        document.body.appendChild(h);
        setTimeout(() => h.remove(), dur * 1000);
    }

    for (let i = 0; i < 8; i++) setTimeout(spawnHeart, i * 250);
    setInterval(spawnHeart, 500);

    function confetti() {
        const c = document.createElement('canvas');
        c.id = 'confetti';
        document.body.appendChild(c);
        const ctx = c.getContext('2d');
        const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
        resize();
        window.addEventListener('resize', resize);

        const colors = ['#ff4d79', '#ffb3c6', '#ffd166', '#ffffff', '#c77dff', '#06d6a0'];
        const parts = Array.from({ length: 150 }, () => ({
            x: Math.random() * c.width,
            y: -20 - Math.random() * c.height * 0.6,
            w: 6 + Math.random() * 6,
            h: 8 + Math.random() * 8,
            vx: -1.5 + Math.random() * 3,
            vy: 2 + Math.random() * 3.5,
            rot: Math.random() * 6.28,
            vr: -0.15 + Math.random() * 0.3,
            color: colors[Math.floor(Math.random() * colors.length)]
        }));

        (function frame() {
            ctx.clearRect(0, 0, c.width, c.height);
            let alive = false;
            parts.forEach(p => {
                p.x += p.vx; p.y += p.vy; p.rot += p.vr;
                if (p.y < c.height + 20) alive = true;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.restore();
            });
            if (alive) requestAnimationFrame(frame); else c.remove();
        })();
    }

    if (document.body.hasAttribute('data-confetti')) confetti();
})();
