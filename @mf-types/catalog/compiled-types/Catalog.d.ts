import { type MarqetProduct } from './types';
import './styles.css';
export interface CatalogProps {
    onAddToCart: (p: MarqetProduct) => void;
    query?: string;
}
export declare function Catalog({ onAddToCart, query }: CatalogProps): import("react").JSX.Element;
