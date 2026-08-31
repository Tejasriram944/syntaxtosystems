import { Composition, registerRoot } from 'remotion'
import { PosterComposition, type RenderProps } from './PosterComposition'

const defaults: RenderProps = {
  image_data_url: 'data:image/png;base64,iVBORw0KGgo=',
  section_heights: { concept: 235, core: 390, proof: 610, flow: 400 },
}

function Root() {
  return <Composition id="PosterVideo" component={PosterComposition} width={1080} height={1920} fps={30} durationInFrames={180} defaultProps={defaults} />
}

registerRoot(Root)
