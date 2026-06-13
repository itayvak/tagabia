export async function triggerTaskConfetti() {
  const confetti = (await import("canvas-confetti")).default;

  confetti({
    particleCount: 60,
    spread: 60,
    startVelocity: 28,
    origin: { y: 0.65 },
    ticks: 120,
    gravity: 1.1,
    scalar: 0.9,
  });
}
