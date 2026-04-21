import { motion } from "framer-motion";

/**
 * VisionSection — full-width, cinematic deep-green vision statement.
 * Copy is expected to come from site_settings.vision_statement.
 */
export default function VisionSection({ vision }) {
  if (!vision) return null;
  return (
    <section
      className="relative bg-brand-obsidian-soft overflow-hidden"
      data-testid="home-vision-section"
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(232, 168, 74,0.18), transparent 60%)",
        }}
      />
      <div className="relative max-w-5xl mx-auto px-6 lg:px-10 py-28 lg:py-36 text-center">
        {/* Gold rule — top */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.22, 0.61, 0.36, 1] }}
          className="h-px w-32 bg-brand-gold mx-auto origin-center"
        />

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="eyebrow text-brand-gold tracking-[0.35em] mt-8 mb-10"
        >
          Our Vision
        </motion.p>

        <motion.blockquote
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.2 }}
          className="font-display text-brand-parchment leading-[1.35] text-3xl sm:text-4xl lg:text-5xl max-w-4xl mx-auto tracking-[-0.015em]"
          data-testid="vision-statement"
        >
          {vision}
        </motion.blockquote>

        {/* Gold rule — bottom */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
          className="h-px w-32 bg-brand-gold mx-auto mt-12 origin-center"
        />
      </div>
    </section>
  );
}
