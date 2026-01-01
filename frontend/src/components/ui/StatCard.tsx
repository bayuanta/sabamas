'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface StatCardProps {
    title: string
    value: string | number
    icon: LucideIcon
    gradient: string
    trend?: {
        value: string
        isPositive: boolean
    }
    delay?: number
}

export default function StatCard({ title, value, icon: Icon, gradient, trend, delay = 0 }: StatCardProps) {
    const [displayValue, setDisplayValue] = useState(0)
    const [isAnimating, setIsAnimating] = useState(false)

    // Animate number if it's a number
    useEffect(() => {
        if (typeof value === 'number') {
            setIsAnimating(true)
            const duration = 1000
            const steps = 60
            const increment = value / steps
            let current = 0

            const timer = setInterval(() => {
                current += increment
                if (current >= value) {
                    setDisplayValue(value)
                    clearInterval(timer)
                    setIsAnimating(false)
                } else {
                    setDisplayValue(Math.floor(current))
                }
            }, duration / steps)

            return () => clearInterval(timer)
        }
    }, [value])

    const displayText = typeof value === 'number' ? displayValue.toLocaleString('id-ID') : value

    // Extract colors from gradient class string for borders/shadows (approximation)
    const getAccentColor = (gradientClass: string) => {
        if (gradientClass.includes('emerald')) return 'group-hover:border-emerald-200'
        if (gradientClass.includes('blue')) return 'group-hover:border-blue-200'
        if (gradientClass.includes('rose')) return 'group-hover:border-rose-200'
        if (gradientClass.includes('violet')) return 'group-hover:border-violet-200'
        return 'group-hover:border-gray-200'
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            className={cn(
                "relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg group",
                getAccentColor(gradient)
            )}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                    <motion.div
                        className="text-2xl font-bold text-gray-900"
                        animate={isAnimating ? { scale: [1, 1.02, 1] } : {}}
                    >
                        {displayText}
                    </motion.div>
                </div>
                <div className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-lg",
                    gradient
                )}>
                    <Icon className="h-6 w-6" strokeWidth={2.5} />
                </div>
            </div>

            {/* Bottom Section with Trend */}
            <div className="mt-4 flex items-center gap-2">
                {trend ? (
                    <div className={cn(
                        "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                        trend.isPositive
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                    )}>
                        <span>{trend.isPositive ? '↑' : '↓'}</span>
                        <span>{trend.value}</span>
                        <span className="font-normal text-gray-400 ml-1">vs bulan lalu</span>
                    </div>
                ) : (
                    <div className="h-6" /> // spacer if no trend
                )}
            </div>

            {/* Decorative subtle shine */}
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gray-50 opacity-50 blur-2xl group-hover:bg-gray-100 transition-colors" />
        </motion.div>
    )
}
