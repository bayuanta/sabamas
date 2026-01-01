'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { settingsApi } from '@/lib/api'

export default function FaviconManager() {
    const { data: settings } = useQuery({
        queryKey: ['settings'],
        queryFn: async () => {
            try {
                const { data } = await settingsApi.get()
                return data
            } catch (error) {
                return null
            }
        },
        staleTime: 5 * 60 * 1000,
    })

    useEffect(() => {
        if (settings?.logo) {
            // Store logo URL in localStorage for print templates to access synchronously/easily
            const logoUrl = `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/api\/?$/, '')}${settings.logo}`
            localStorage.setItem('logo_url', logoUrl)

            // Update Favicon
            const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']") || document.createElement('link')
            link.type = 'image/x-icon'
            link.rel = 'shortcut icon'
            link.href = logoUrl
            document.getElementsByTagName('head')[0].appendChild(link)
        }
    }, [settings])

    return null
}
