import React from 'react';
import * as AspectRatioPrimitive from '@radix-ui/react-aspect-ratio';

function AspectRatio(_{
  ...props
}: React.ComponentProps<typeof AspectRatioPrimitive.Root>) {
  return <AspectRatioPrimitive.Root data-slot="aspect-ratio" {...props} />;
}

export { AspectRatio };
