import { AbsoluteFill, Img, interpolate, useCurrentFrame } from 'remotion'

type Heights = { concept: number; core: number; proof: number; flow: number }
export type RenderProps = { image_data_url: string; section_heights: Heights }

const COLORS = ['#ff4fa0', '#a6e900', '#ff4fa0', '#11d8ff']

export function sectionRects(heights: Heights) {
  const conceptY = 152
  const coreY = conceptY + heights.concept + 14
  const proofY = coreY + heights.core + 14
  const flowY = proofY + heights.proof + 14
  return [
    { y: conceptY, height: heights.concept },
    { y: coreY, height: heights.core },
    { y: proofY, height: heights.proof },
    { y: flowY, height: heights.flow },
  ]
}

export function PosterComposition({ image_data_url, section_heights }: RenderProps) {
  const frame = useCurrentFrame()
  return <AbsoluteFill style={{ backgroundColor: '#020305' }}>
    <Img src={image_data_url} style={{ width: 1080, height: 1920 }} />
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{ position: 'absolute', inset: 0 }}>
      <defs>{COLORS.map((color, index) => <filter id={`glow-${index}`} key={color} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6" result="blur" /><feFlood floodColor={color} floodOpacity=".9" /><feComposite in2="blur" operator="in" /><feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge></filter>)}</defs>
      {sectionRects(section_heights).map((rect, index) => {
        const localFrame = frame - index * 45
        const active = localFrame >= 0 && localFrame < 45
        const progress = interpolate(localFrame, [0, 44], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
        return <rect key={index} x="26" y={rect.y + 1} width="1028" height={rect.height - 2} rx="16" pathLength="100" fill="none" stroke={COLORS[index]} strokeWidth="4" strokeLinecap="round" strokeDasharray="16 84" strokeDashoffset={100 - progress * 100} opacity={active ? 1 : 0} filter={`url(#glow-${index})`} />
      })}
    </svg>
  </AbsoluteFill>
}
