export const fadeInBottomWithScaleX = () => ({
  hidden: { opacity: 0, y: 40, scaleX: 0.95 },
  visible: { opacity: 1, y: 0, scaleX: 1, transition: { duration: 0.3 } },
}); 