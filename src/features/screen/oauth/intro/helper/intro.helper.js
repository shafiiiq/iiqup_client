import { LIGHTNING_BOLT_COUNT, LIGHTNING_BOLT_LIFETIME_MS, LIGHTNING_BOLT_MAX_START_DELAY_MS } from '../constants/intro.constant';

export const generateRandomLightningPath = (maxWidth, maxHeight) => {
    const startX = maxWidth / 2;
    const startY = 0;
    let path = `M ${startX} ${startY}`;

    let x = startX;
    let y = startY;

    const segments = 5 + Math.floor(Math.random() * 8);
    const segmentHeight = maxHeight / segments;

    for (let i = 0; i < segments; i++) {
        x += (Math.random() - 0.5) * (maxWidth * 0.6);
        y += segmentHeight + (Math.random() - 0.5) * 30;

        path += ` L ${x} ${y}`;

        if (Math.random() > 0.5) {
            const branchX = x + (Math.random() - 0.5) * 80;
            const branchY = y + 20 + Math.random() * 50;
            path += ` M ${x} ${y} L ${branchX} ${branchY} M ${x} ${y}`;
        }
    }

    return path;
};

export const createLightningStorm = () => {
    const container = document.querySelector('.intro-hero');
    const rect = container.getBoundingClientRect();

    for (let i = 0; i < LIGHTNING_BOLT_COUNT; i++) {
        setTimeout(() => {
            const lightning = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            lightning.classList.add('lightning-bolt');

            const startX = Math.random() * rect.width;
            const startY = Math.random() * rect.height;

            const width = 100 + Math.random() * 300;
            const height = 100 + Math.random() * 400;

            lightning.style.left = `${startX}px`;
            lightning.style.top = `${startY}px`;
            lightning.style.width = `${width}px`;
            lightning.style.height = `${height}px`;

            const rotation = Math.random() * 360;
            lightning.style.transform = `rotate(${rotation}deg)`;

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const pathData = generateRandomLightningPath(width, height);
            path.setAttribute('d', pathData);
            path.setAttribute('stroke', `rgba(251, 191, 36, ${0.7 + Math.random() * 0.3})`);
            path.setAttribute('stroke-width', `${2 + Math.random() * 3}`);
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke-linecap', 'round');

            const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
            filter.setAttribute('id', `glow-${i}`);
            const feGaussianBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
            feGaussianBlur.setAttribute('stdDeviation', '3');
            filter.appendChild(feGaussianBlur);
            defs.appendChild(filter);
            lightning.appendChild(defs);
            lightning.appendChild(path);

            path.style.filter = `url(#glow-${i}) drop-shadow(0 0 10px rgba(251, 191, 36, 0.8))`;

            container.appendChild(lightning);

            setTimeout(() => {
                lightning.remove();
            }, LIGHTNING_BOLT_LIFETIME_MS);
        }, Math.random() * LIGHTNING_BOLT_MAX_START_DELAY_MS);
    }
};