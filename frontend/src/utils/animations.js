import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export const splashAnimation = () => {
  const tl = gsap.timeline()
  tl.from('.splash-letter', {
    y: 80,
    opacity: 0,
    duration: 0.6,
    stagger: 0.07,
    ease: 'power3.out',
  }).from(
    '.splash-subtitle',
    {
      y: 20,
      opacity: 0,
      duration: 0.5,
      ease: 'power2.out',
    },
    '-=0.2'
  )
  return tl
}

export const floatingLeaves = () => {
  gsap.utils.toArray('.leaf').forEach((leaf, i) => {
    gsap.set(leaf, {
      x: Math.random() * window.innerWidth,
      y: window.innerHeight + 50,
      rotation: Math.random() * 360,
    })
    gsap.to(leaf, {
      y: -120,
      x: `+=${Math.sin(i * 1.3) * 120}`,
      rotation: 360 * (Math.random() > 0.5 ? 1 : -1),
      duration: 5 + Math.random() * 5,
      repeat: -1,
      ease: 'none',
      delay: Math.random() * 4,
    })
  })
}

export const scrollReveal = (selector, stagger = 0.1, y = 40) => {
  gsap.fromTo(selector,
    { y, opacity: 0 },
    {
      scrollTrigger: {
        trigger: selector,
        start: 'top 85%',
        toggleActions: 'play none none reverse',
      },
      y: 0,
      opacity: 1,
      duration: 0.6,
      stagger,
      ease: 'power2.out',
    }
  )
}

export const cardHover = (el) =>
  gsap.to(el, { y: -6, scale: 1.025, duration: 0.22, ease: 'power2.out' })

export const cardHoverOut = (el) =>
  gsap.to(el, { y: 0, scale: 1, duration: 0.22, ease: 'power2.out' })

export const countUp = (el, target) => {
  const obj = { val: 0 }
  gsap.to(obj, {
    val: target,
    duration: 1.5,
    ease: 'power2.out',
    onUpdate: () => {
      if (el) el.textContent = Math.round(obj.val).toLocaleString('en-IN')
    },
  })
}

export const pageVariants = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.38, ease: 'easeOut' } },
  exit: { opacity: 0, y: -18, transition: { duration: 0.22 } },
}
