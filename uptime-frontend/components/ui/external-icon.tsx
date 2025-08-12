import React from 'react'

interface ExternalIconProps {
  src: string
  alt?: string
  className?: string
  size?: number
}

export function ExternalIcon({ src, alt = "icon", className = "", size = 24 }: ExternalIconProps) {
  return (
    <img 
      src={src} 
      alt={alt} 
      className={`inline-block ${className}`}
      style={{ width: size, height: size }}
    />
  )
}

export const aboutIcons = {
  user: "/assets/svg/user.svg",
  briefcase: "/assets/svg/briefcase.svg",
  target: "/assets/svg/target.svg",
  users: "/assets/svg/users.svg",
  code: "/assets/svg/code.svg",
  award: "/assets/svg/award.svg",
  trending: "/assets/svg/trending-up.svg",
  github: "/assets/svg/github.svg",
  globe: "/assets/svg/globe.svg",
  rocket: "/assets/svg/rocket.svg",
  star: "/assets/svg/star.svg",
  heart: "/assets/svg/heart.svg",
  book: "/assets/svg/book-open.svg",
  coffee: "/assets/svg/coffee.svg",
  clock: "/assets/svg/clock.svg",
  google: "/assets/svg/google.svg",
  ibm: "/assets/svg/ibm.svg",
  meta: "/assets/svg/meta.svg",
  cpu: "/assets/svg/runtime.svg",
  cloud: "/assets/svg/azure.svg",
  deploy: "/assets/svg/deploy.svg"
}
