"use client";

import { useEffect, useState, useRef } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { Sparkles, ArrowRight, FileText } from 'lucide-react';

// Text wave effect component with hydration safety
const TextWaveEffect = ({ text }: { text: string }) => {
    const [isMounted, setIsMounted] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Initial render matches server-side
    if (!isMounted) {
        return (
            <span className="bg-gradient-to-r from-[#7042E6] to-[#A17FFF] bg-clip-text text-transparent">
                {text}
            </span>
        );
    }

    return (
        <span
            className="relative inline-block"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {text.split('').map((letter, index) => (
                <span
                    key={index}
                    className="relative inline-block transition-transform duration-300"
                    style={{
                        transform: isHovered
                            ? `translateY(${Math.sin(index * 0.3) * 8}px)`
                            : 'none'
                    }}
                >
                    <span className="bg-gradient-to-r from-[#7042E6] to-[#A17FFF] bg-clip-text text-transparent">
                        {letter}
                    </span>
                </span>
            ))}
        </span>
    );
};

// Button component with safe hover effects
const AnimatedButton = ({
    children,
    primary = false
}: {
    children: React.ReactNode;
    primary?: boolean;
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Initial render matches server-side
    if (!isMounted) {
        return (
            <button
                className={`px-8 py-4 rounded-lg flex items-center gap-2 text-lg transition-colors
                    ${primary
                        ? 'bg-[#7042E6] text-white'
                        : 'border border-zinc-200 dark:border-zinc-700'
                    }`}
            >
                {children}
            </button>
        );
    }

    return (
        <button
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`relative px-8 py-4 rounded-lg flex items-center gap-2 text-lg overflow-hidden
                ${primary
                    ? 'bg-[#7042E6] text-white hover:bg-[#5c35c4]'
                    : 'border border-zinc-200 dark:border-zinc-700 hover:border-[#5c35c4] hover:text-[#5c35c4]'
                }`}
        >
            <div className="relative z-10 flex items-center gap-2">
                {children}
            </div>
            {isHovered && (
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 opacity-25 bg-gradient-to-r from-transparent via-white to-transparent animate-shine" />
                </div>
            )}
        </button>
    );
};

// Background animation component
const BackgroundAnimation = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const dotsRef = useRef<{ x: number; y: number; radius: number; speedX: number; speedY: number }[]>([]);
    const animationFrameIdRef = useRef<number | null>(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!isClient) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const numDots = 150;
        const dots = dotsRef.current;

        const initDots = (width: number, height: number) => {
            return Array.from({ length: numDots }, () => ({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: Math.random() * 1 + 0.5,
                speedX: (Math.random() - 0.5) * 0.3,
                speedY: (Math.random() - 0.5) * 0.3
            }));
        };

        const resizeCanvas = () => {
            if (!canvas) return;
            
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            dotsRef.current = initDots(canvas.width, canvas.height);
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        const animate = () => {
            if (!canvas || !ctx) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';

            dotsRef.current.forEach(dot => {
                // Update position with wrapping
                dot.x = (dot.x + dot.speedX + canvas.width) % canvas.width;
                dot.y = (dot.y + dot.speedY + canvas.height) % canvas.height;

                // Draw dot
                ctx.beginPath();
                ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
                ctx.fill();

                // Draw connections
                dotsRef.current.forEach(otherDot => {
                    const dx = dot.x - otherDot.x;
                    const dy = dot.y - otherDot.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 100) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(255, 255, 255, ${0.05 * (1 - distance / 100)})`;
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(dot.x, dot.y);
                        ctx.lineTo(otherDot.x, otherDot.y);
                        ctx.stroke();
                    }
                });
            });

            animationFrameIdRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
            }
        };
    }, [isClient]);

    // Initial server-side render is empty to prevent hydration mismatch
    if (!isClient) return null;

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ opacity: 0.8 }}
        />
    );
};

// Main component
export default function Home() {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        AOS.init({
            duration: 800,
            once: false,
        });
    }, []);

    return (
        <div className="min-h-screen bg-white dark:bg-[#0A051B] text-zinc-900 dark:text-white relative">
            <BackgroundAnimation />
            
            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden z-10">
                {/* Gradient effects */}
                <div className="absolute inset-0 -z-10">
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#7042E6] rounded-full opacity-10 dark:opacity-20 blur-[120px]" />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[300px] bg-[#7042E6] rounded-full opacity-5 dark:opacity-10 blur-[100px]" />
                </div>

                <div className="container mx-auto px-4">
                    {/* Tag line */}
                    <div className="flex justify-center mb-8" data-aos="fade-down">
                        <div className="px-4 py-1.5 rounded-full bg-purple-100/50 dark:bg-[#21164C] border border-purple-200 dark:border-[#352F44] flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-[#7042E6]" />
                            <span className="text-sm text-zinc-600 dark:text-[#A29FB1]">Web3 Payroll Solution</span>
                        </div>
                    </div>

                    {/* Main content */}
                    <div className="max-w-4xl mx-auto text-center" data-aos="fade-up">
                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold mb-6 tracking-tight text-black dark:text-[rgba(255,255,255,.9)]">
                            Future of Payroll with{" "}
                            <TextWaveEffect text=" Peyroll" />
                        </h1>
                        <p className="text-lg text-zinc-600 dark:text-[#A29FB1] mb-12 max-w-xl mx-auto">
                            Never miss a payment, automate your payroll, and manage everything with blockchain security.
                        </p>

                        {/* Stats */}
                        <div className="flex justify-center gap-12 mb-12">
                            {[
                                { label: 'Total Volume', value: '$100M+' },
                                { label: 'Transactions', value: '50k+' },
                                { label: 'Users', value: '10k+' },
                            ].map((stat) => (
                                <div
                                    key={stat.label}
                                    className="text-center"
                                    data-aos="fade-up"
                                >
                                    <div className="text-2xl font-semibold mb-1">{stat.value}</div>
                                    <div className="text-sm text-zinc-600 dark:text-[#A29FB1]">{stat.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-center gap-4 mb-12" data-aos="fade-up" data-aos-delay="200">
                          <AnimatedButton primary>
                            Get Started
                            <ArrowRight className="w-5 h-5" />
                          </AnimatedButton>
                          <AnimatedButton>
                            <FileText className="w-5 h-5" />
                            Read Docs
                          </AnimatedButton>
                        </div>
                    </div>
                </div>
            </section>

            <style jsx global>{`
                @keyframes shine {
                    from { transform: translateX(-100%); }
                    to { transform: translateX(100%); }
                }
                
                .animate-shine {
                    animation: shine 1.5s infinite;
                }
            `}</style>
        </div>
    );
}