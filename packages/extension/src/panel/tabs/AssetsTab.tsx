import React, { useState } from 'react';
import type { ExtractedDesignData } from '../../shared/messaging';

interface Props {
  data: ExtractedDesignData;
}

type View = 'images' | 'icons' | 'fonts' | 'favicons';

export default function AssetsTab({ data }: Props) {
  const [view, setView] = useState<View>('images');

  return (
    <div className="space-y-4">
      <div className="flex gap-1">
        {([
          ['images', `Images (${data.images.length})`],
          ['icons', `SVG Icons (${data.icons.length})`],
          ['fonts', `Fonts (${data.fontFaces.length})`],
          ['favicons', `Favicons (${data.favicons.length})`],
        ] as [View, string][]).map(([v, label]) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
              view === v ? 'bg-accent/20 text-accent' : 'text-secondary hover:bg-hover'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {view === 'images' && <ImagesView images={data.images} />}
      {view === 'icons' && <IconsView icons={data.icons} />}
      {view === 'fonts' && <FontsView fontFaces={data.fontFaces} />}
      {view === 'favicons' && <FaviconsView favicons={data.favicons} />}
    </div>
  );
}

function ImagesView({ images }: { images: ExtractedDesignData['images'] }) {
  if (images.length === 0) return <Empty text="No images found on this page." />;
  return (
    <div className="grid grid-cols-3 gap-2">
      {images.map((img, i) => (
        <a
          key={i}
          href={img.url}
          target="_blank"
          rel="noopener"
          className="group bg-card rounded-lg overflow-hidden border border-border hover:border-accent/50 transition-colors"
        >
          <div className="aspect-square bg-surface flex items-center justify-center overflow-hidden">
            <img src={img.url} alt={img.alt || ''} className="max-w-full max-h-full object-contain" loading="lazy" />
          </div>
          <div className="p-2">
            <div className="text-[10px] text-secondary truncate">{img.alt || img.url.split('/').pop()}</div>
            {img.width && img.height && (
              <div className="text-[9px] text-tertiary">{img.width}×{img.height} · {img.format}</div>
            )}
          </div>
        </a>
      ))}
    </div>
  );
}

function IconsView({ icons }: { icons: ExtractedDesignData['icons'] }) {
  if (icons.length === 0) return <Empty text="No SVG icons found." />;
  return (
    <div className="grid grid-cols-6 gap-2">
      {icons.map((icon, i) => (
        <button
          key={i}
          onClick={() => {
            navigator.clipboard.writeText(icon.svg);
          }}
          className="group bg-card rounded-lg p-3 flex flex-col items-center gap-1.5 border border-border hover:border-accent/50 transition-colors"
          title={`${icon.name} — click to copy SVG`}
        >
          <div
            className="w-8 h-8 flex items-center justify-center text-primary [&>svg]:w-full [&>svg]:h-full"
            dangerouslySetInnerHTML={{ __html: icon.svg }}
          />
          <span className="text-[8px] text-tertiary truncate max-w-full">{icon.name}</span>
        </button>
      ))}
    </div>
  );
}

function FontsView({ fontFaces }: { fontFaces: ExtractedDesignData['fontFaces'] }) {
  if (fontFaces.length === 0) return <Empty text="No @font-face declarations found." />;
  return (
    <div className="space-y-2">
      {fontFaces.map((ff, i) => (
        <div key={i} className="bg-card rounded-lg p-3 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-primary">{ff.family}</span>
            <span className="text-[10px] text-secondary">{ff.weight} / {ff.style}</span>
            {ff.format && (
              <span className="text-[10px] text-accent bg-accent/10 px-1.5 py-0.5 rounded">{ff.format}</span>
            )}
          </div>
          {ff.url && (
            <a
              href={ff.url}
              target="_blank"
              rel="noopener"
              className="text-[10px] font-mono text-blue-400 hover:underline truncate block"
            >
              {ff.url}
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

function FaviconsView({ favicons }: { favicons: ExtractedDesignData['favicons'] }) {
  if (favicons.length === 0) return <Empty text="No favicons found." />;
  return (
    <div className="grid grid-cols-4 gap-3">
      {favicons.map((fav, i) => (
        <a
          key={i}
          href={fav.href}
          target="_blank"
          rel="noopener"
          className="bg-card rounded-lg p-3 flex flex-col items-center gap-2 border border-border hover:border-accent/50 transition-colors"
        >
          <img src={fav.href} alt="favicon" className="w-8 h-8 object-contain" />
          <div className="text-center">
            {fav.sizes && <div className="text-[10px] text-secondary">{fav.sizes}</div>}
            {fav.type && <div className="text-[9px] text-tertiary">{fav.type}</div>}
          </div>
        </a>
      ))}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="text-xs text-tertiary py-8 text-center">{text}</div>;
}
