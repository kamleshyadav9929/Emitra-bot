import { useState, useEffect, useRef } from "react"
import { useInView } from "motion/react"

export default function useCountUp(end, duration = 1800, start = 0) {
    const [count, setCount] = useState(start)
    const ref = useRef(null)
    const inView = useInView(ref, { once: true, margin: "-100px" })

    useEffect(() => {
        if (!inView) return
        let startTime = null
        const step = (timestamp) => {
            if (!startTime) startTime = timestamp
            const progress = Math.min((timestamp - startTime) / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
            setCount(Math.floor(eased * (end - start) + start))
            if (progress < 1) requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
    }, [inView, end, duration, start])

    return { count, ref }
}
