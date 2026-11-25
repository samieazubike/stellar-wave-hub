"use client";

import {useEffect, useState, useRef} from "react";

interface CountUpProps {
	end: number;
	duration?: number;
	className?: string;
}

export default function CountUp({
	end,
	duration = 2000,
	className = "",
}: CountUpProps) {
	const [count, setCount] = useState(0);
	const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
	const animationRef = useRef<number | null>(null);

	useEffect(() => {
		// Check for prefers-reduced-motion
		const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
		setPrefersReducedMotion(mediaQuery.matches);

		const handleChange = (e: MediaQueryListEvent) => {
			setPrefersReducedMotion(e.matches);
		};

		mediaQuery.addEventListener("change", handleChange);
		return () => mediaQuery.removeEventListener("change", handleChange);
	}, []);

	useEffect(() => {
		// If reduced motion is preferred, jump to end value immediately
		if (prefersReducedMotion) {
			setCount(end);
			return;
		}

		// Otherwise, animate the count-up
		const startTime = Date.now();
		const startValue = 0;

		const animate = () => {
			const now = Date.now();
			const elapsed = now - startTime;
			const progress = Math.min(elapsed / duration, 1);

			// Easing function (ease-out cubic)
			const eased = 1 - Math.pow(1 - progress, 3);
			const current = Math.floor(startValue + (end - startValue) * eased);

			setCount(current);

			if (progress < 1) {
				animationRef.current = requestAnimationFrame(animate);
			}
		};

		animationRef.current = requestAnimationFrame(animate);

		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [end, duration, prefersReducedMotion]);

	return <span className={className}>{count.toLocaleString()}</span>;
}
