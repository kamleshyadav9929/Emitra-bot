import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

/**
 * useGSAPReveal — Attach scroll-triggered reveal animation to a ref.
 * 
 * @param {object}  options
 * @param {string}  options.from   - Initial state (e.g. { y: 60, opacity: 0 })
 * @param {string}  options.to     - End state (e.g. { y: 0, opacity: 1 })
 * @param {number}  options.delay  - Delay before animation starts
 * @param {number}  options.duration - Animation duration
 * @param {string}  options.ease   - GSAP easing function
 * @param {string}  options.start  - ScrollTrigger start (default "top 85%")
 * @param {boolean} options.once   - Only animate once (default true)
 */
export function useGSAPReveal({
    from = { y: 60, opacity: 0 },
    to = {},
    delay = 0,
    duration = 1,
    ease = "power3.out",
    start = "top 85%",
    once = true,
} = {}) {
    const ref = useRef(null)

    useEffect(() => {
        const el = ref.current
        if (!el) return

        gsap.set(el, from)

        const tween = gsap.to(el, {
            ...{ y: 0, opacity: 1, ...to },
            delay,
            duration,
            ease,
            scrollTrigger: {
                trigger: el,
                start,
                toggleActions: once ? "play none none none" : "play none none reverse",
            }
        })

        return () => {
            tween.scrollTrigger?.kill()
            tween.kill()
        }
    }, [])

    return ref
}

/**
 * useGSAPStagger — Stagger-animate children of a container on scroll.
 * 
 * @param {string}  childSelector  CSS selector for children to stagger
 * @param {object}  options        Animation options
 */
export function useGSAPStagger(childSelector, {
    from = { y: 40, opacity: 0 },
    to = {},
    stagger = 0.08,
    delay = 0,
    duration = 0.7,
    ease = "power3.out",
    start = "top 85%",
    once = true,
} = {}) {
    const ref = useRef(null)

    useEffect(() => {
        const container = ref.current
        if (!container) return

        const children = container.querySelectorAll(childSelector)
        if (children.length === 0) return

        gsap.set(children, from)

        const tween = gsap.to(children, {
            ...{ y: 0, opacity: 1, ...to },
            stagger,
            delay,
            duration,
            ease,
            scrollTrigger: {
                trigger: container,
                start,
                toggleActions: once ? "play none none none" : "play none none reverse",
            }
        })

        return () => {
            tween.scrollTrigger?.kill()
            tween.kill()
        }
    }, [])

    return ref
}

/**
 * useGSAPParallax — Create a parallax scroll effect on an element.
 */
export function useGSAPParallax(speed = 0.3) {
    const ref = useRef(null)

    useEffect(() => {
        const el = ref.current
        if (!el) return

        const tween = gsap.to(el, {
            yPercent: speed * 100,
            ease: "none",
            scrollTrigger: {
                trigger: el,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
            }
        })

        return () => {
            tween.scrollTrigger?.kill()
            tween.kill()
        }
    }, [])

    return ref
}

/**
 * useGSAPTextReveal — Split text and animate words/chars on scroll.
 */
export function useGSAPTextReveal({
    splitBy = "words",
    from = { y: "100%", opacity: 0 },
    stagger = 0.04,
    duration = 0.8,
    ease = "power4.out",
    start = "top 85%",
    delay = 0,
} = {}) {
    const ref = useRef(null)

    useEffect(() => {
        const el = ref.current
        if (!el) return

        const text = el.textContent
        el.innerHTML = ""

        const wrapperStyle = "overflow:hidden;display:inline-block;vertical-align:top;"

        if (splitBy === "words") {
            const words = text.split(/\s+/)
            words.forEach((word, i) => {
                const wrapper = document.createElement("span")
                wrapper.style.cssText = wrapperStyle
                const inner = document.createElement("span")
                inner.style.cssText = "display:inline-block;will-change:transform,opacity;"
                inner.textContent = word + (i < words.length - 1 ? "\u00A0" : "")
                wrapper.appendChild(inner)
                el.appendChild(wrapper)
            })
        } else {
            const chars = text.split("")
            chars.forEach((char) => {
                const wrapper = document.createElement("span")
                wrapper.style.cssText = wrapperStyle
                const inner = document.createElement("span")
                inner.style.cssText = "display:inline-block;will-change:transform,opacity;"
                inner.textContent = char === " " ? "\u00A0" : char
                wrapper.appendChild(inner)
                el.appendChild(wrapper)
            })
        }

        const targets = el.querySelectorAll("span > span")
        gsap.set(targets, from)

        const tween = gsap.to(targets, {
            y: 0,
            opacity: 1,
            stagger,
            duration,
            ease,
            delay,
            scrollTrigger: {
                trigger: el,
                start,
                toggleActions: "play none none none",
            }
        })

        return () => {
            tween.scrollTrigger?.kill()
            tween.kill()
            el.textContent = text
        }
    }, [])

    return ref
}

/**
 * useGSAPCounter — Animate a number counting up on scroll.
 */
export function useGSAPCounter(endValue, {
    duration = 2,
    ease = "power2.out",
    start = "top 80%",
    suffix = "",
    prefix = "",
} = {}) {
    const ref = useRef(null)

    useEffect(() => {
        const el = ref.current
        if (!el) return

        const obj = { val: 0 }
        el.textContent = prefix + "0" + suffix

        const tween = gsap.to(obj, {
            val: endValue,
            duration,
            ease,
            onUpdate: () => {
                el.textContent = prefix + Math.round(obj.val) + suffix
            },
            scrollTrigger: {
                trigger: el,
                start,
                toggleActions: "play none none none",
            }
        })

        return () => {
            tween.scrollTrigger?.kill()
            tween.kill()
        }
    }, [endValue])

    return ref
}
