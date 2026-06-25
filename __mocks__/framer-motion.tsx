// Mock framer-motion for tests: AnimatePresence unmounts immediately, motion.* are plain elements
import React from "react";

// AnimatePresence: render children as-is (no exit animations)
export const AnimatePresence = ({ children }: { children?: React.ReactNode }) => (
  <>{children}</>
);

// Factory that returns a plain HTML element forwarder
function createMotionComponent(tag: string) {
  return React.forwardRef(function MotionComponent(
    { children, ...props }: Record<string, unknown> & { children?: React.ReactNode },
    ref: React.Ref<unknown>
  ) {
    // Strip framer-motion-specific props
    const {
      initial, animate, exit, variants, whileHover, whileTap, whileInView,
      transition, layout, layoutId, onAnimationComplete, onAnimationStart,
      drag, dragConstraints, dragElastic, dragMomentum,
      ...htmlProps
    } = props;
    void initial; void animate; void exit; void variants; void whileHover; void whileTap;
    void whileInView; void transition; void layout; void layoutId;
    void onAnimationComplete; void onAnimationStart; void drag; void dragConstraints;
    void dragElastic; void dragMomentum;
    return React.createElement(tag, { ...htmlProps, ref }, children);
  });
}

// motion object with common HTML elements
export const motion = new Proxy(
  {},
  {
    get(_target, prop: string) {
      return createMotionComponent(prop);
    },
  }
) as Record<string, ReturnType<typeof createMotionComponent>>;

// Other framer-motion exports used in lib/motion.ts
// Return true in test environment so animations (e.g. useCountUp) skip to final value immediately.
export const useReducedMotion = () => true;
export const useAnimation = () => ({ start: () => {}, stop: () => {} });
export const useInView = () => false;
export const useScroll = () => ({ scrollY: { get: () => 0 } });
export const useTransform = (_v: unknown, _from: unknown, _to: unknown) => ({ get: () => 0 });
export const useSpring = (value: unknown) => value;
export const useMotionValue = (initial: unknown) => ({ get: () => initial, set: () => {} });
export type { Variants, Transition } from "framer-motion";
