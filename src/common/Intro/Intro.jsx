import React, { useEffect, useState } from 'react'
import Spline from '@splinetool/react-spline';
import Button from '../Button/Button';
import './Intro.css'
import { useNavigate } from 'react-router';
import { checkWebGLSupport } from '../../utils/compatibilty';

function Intro() {
    const navigate = useNavigate()
    const [isDisintegrating, setIsDisintegrating] = useState(false)
    const [splineError, setSplineError] = useState(false);
    const [supportsWebGL, setSupportsWebGL] = useState(true);

    useEffect(() => {
        const hasWebGL = checkWebGLSupport();
        setSupportsWebGL(hasWebGL);

        if (!hasWebGL) {
            localStorage.setItem('hasSeenIntro', 'true');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        }
    }, [navigate]);

    useEffect(() => {
        if (splineError) {
            console.log('Auto-redirecting to login from intro');
            localStorage.setItem('hasSeenIntro', 'true');
            setTimeout(() => {
                navigate('/login');
            }, 1000);
        }
    }, [splineError, navigate]);

    const handleLoginClick = () => {
        localStorage.setItem('hasSeenIntro', 'true')

        setIsDisintegrating(true)
        createLightningStorm()

        setTimeout(() => {
            navigate('/login')
        }, 2000)
    }

    const createLightningStorm = () => {
        const container = document.querySelector('.intro-hero')
        const boltCount = 15 // JUST A FEW
        const rect = container.getBoundingClientRect()

        for (let i = 0; i < boltCount; i++) {
            setTimeout(() => {
                const lightning = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
                lightning.classList.add('lightning-bolt')

                // RANDOM position across ENTIRE screen
                const startX = Math.random() * rect.width
                const startY = Math.random() * rect.height

                // RANDOM size
                const width = 100 + Math.random() * 300
                const height = 100 + Math.random() * 400

                lightning.style.left = `${startX}px`
                lightning.style.top = `${startY}px`
                lightning.style.width = `${width}px`
                lightning.style.height = `${height}px`

                // RANDOM rotation
                const rotation = Math.random() * 360
                lightning.style.transform = `rotate(${rotation}deg)`

                // Create jagged lightning path
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
                const pathData = generateRandomLightningPath(width, height)
                path.setAttribute('d', pathData)
                path.setAttribute('stroke', `rgba(251, 191, 36, ${0.7 + Math.random() * 0.3})`)
                path.setAttribute('stroke-width', `${2 + Math.random() * 3}`)
                path.setAttribute('fill', 'none')
                path.setAttribute('stroke-linecap', 'round')

                // Add glow
                const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
                const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter')
                filter.setAttribute('id', `glow-${i}`)
                const feGaussianBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur')
                feGaussianBlur.setAttribute('stdDeviation', '3')
                filter.appendChild(feGaussianBlur)
                defs.appendChild(filter)
                lightning.appendChild(defs)
                lightning.appendChild(path)

                path.style.filter = `url(#glow-${i}) drop-shadow(0 0 10px rgba(251, 191, 36, 0.8))`

                container.appendChild(lightning)

                setTimeout(() => {
                    lightning.remove()
                }, 1500)
            }, Math.random() * 1500) // RANDOM timing
        }
    }

    const generateRandomLightningPath = (maxWidth, maxHeight) => {
        const startX = maxWidth / 2
        const startY = 0
        let path = `M ${startX} ${startY}`

        let x = startX
        let y = startY

        // RANDOM number of segments
        const segments = 5 + Math.floor(Math.random() * 8)
        const segmentHeight = maxHeight / segments

        for (let i = 0; i < segments; i++) {
            // RANDOM zigzag
            x += (Math.random() - 0.5) * (maxWidth * 0.6)
            y += segmentHeight + (Math.random() - 0.5) * 30

            path += ` L ${x} ${y}`

            // RANDOM branches
            if (Math.random() > 0.5) {
                const branchX = x + (Math.random() - 0.5) * 80
                const branchY = y + 20 + Math.random() * 50
                path += ` M ${x} ${y} L ${branchX} ${branchY} M ${x} ${y}`
            }
        }

        return path
    }

    return (
        <div className={`intro-hero ${isDisintegrating ? 'disintegrating' : ''}`}>
            <div className="login-navigate">
                <Button
                    text="Login"
                    onClick={handleLoginClick}
                    colorScheme="amber-600"
                    variant="gradient"
                    font="3xl"
                    squircle="4xl"
                    width="300px"
                    height="70px"
                    type="button"
                    textColor="white-200"
                    shadowPosition="to-bottom"
                    shadowColor="white-600"
                />
            </div>
            {supportsWebGL ? (
                <Spline
                    scene="https://prod.spline.design/EJOAGj7lECfjI9oi/scene.splinecode"
                    style={{ width: '100%', height: '105vh' }}
                    onError={() => setSplineError(true)}
                />
            ) : (
                <div className="spline-fallback"> </div>
            )}
        </div>
    )
}

export default Intro