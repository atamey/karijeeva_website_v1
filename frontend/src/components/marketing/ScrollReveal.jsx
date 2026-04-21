import { motion } from "framer-motion";

/**
 * ScrollReveal — gentle fade + y-slide when the element enters viewport.
 * Pass `delay` in ms to stagger neighbours.
 */
export default function ScrollReveal({
  children,
  delay = 0,
  y = 24,
  className = "",
  once = true,
  as: Tag = "div",
}) {
  const MotionTag = motion[Tag] || motion.div;
  return (
    <MotionTag
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-80px" }}
      transition={{ duration: 0.7, delay: delay / 1000, ease: [0.22, 0.61, 0.36, 1] }}
      className={className}
    >
      {children}
    </MotionTag>
  );
}
