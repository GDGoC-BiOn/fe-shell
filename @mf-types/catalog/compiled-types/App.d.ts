import '@bion-mfe-ui/tokens/css';
import type { MarqetProduct } from './types';
export default function App({ onAddToCart, query, }: {
    onAddToCart: (p: MarqetProduct) => void;
    query?: string;
}): import("react").JSX.Element;
