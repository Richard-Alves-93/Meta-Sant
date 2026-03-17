import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WizardPurchase, WizardPet } from "../../hooks/useWizardState";
import { Product } from "@/lib/crm-data";
import { Trash2 } from "lucide-react";
import ProductCombobox from "@/components/crm/ProductCombobox";
import { memo } from "react";

interface CompraFormProps {
  purchase: WizardPurchase;
  index: number;
  pets: WizardPet[];
  products: Product[];
  onChange: (index: number, field: keyof WizardPurchase, value: any) => void;
  onRemove: (index: number) => void;
  showRemove: boolean;
}

/**
 * ETAPA 6c + 8: CompraForm - Memoized Reusable Component
 * Prevents re-render when sibling purchases change
 * Only renders when own data changes
 */

function CompraFormComponent({
  purchase,
  index,
  pets,
  products,
  onChange,
  onRemove,
  showRemove
}: CompraFormProps) {
  const handleProductSelect = (productId: string, productName: string) => {
    onChange(index, 'product_id', productId);
    onChange(index, 'product_name', productName);

    // Auto-fill prazo_recompra from product
    const selectedProduct = products.find(p => p.id === productId);
    if (selectedProduct) {
      onChange(index, 'prazo_recompra', selectedProduct.prazo_recompra_dias);
    }
  };

  return (
    <div className="border border-border/50 rounded-lg p-4 bg-secondary/20">
      <div className="flex justify-between items-start mb-4">
        <h4 className="font-semibold text-sm">Compra Recorrente #{index + 1}</h4>
        {showRemove && (
          <button
            onClick={() => onRemove(index)}
            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
            title="Remover compra"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="grid gap-3">
        {/* Pet Selection - Required */}
        <div>
          <Label htmlFor={`purchase-${index}-pet`} className="text-xs font-medium">
            Para qual Pet? *
          </Label>
          <Select
            value={String(purchase.petIndex)}
            onValueChange={(v) => onChange(index, 'petIndex', parseInt(v))}
          >
            <SelectTrigger id={`purchase-${index}-pet`} className="mt-1 h-8">
              <SelectValue placeholder="Selecione um pet" />
            </SelectTrigger>
            <SelectContent>
              {pets.map((pet, i) => (
                <SelectItem key={i} value={String(i)}>
                  {pet.nome || `Pet ${i + 1}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Product Selection + Auto-fill prazo */}
        <div>
          <Label htmlFor={`purchase-${index}-product`} className="text-xs font-medium">
            Produto *
          </Label>
          <div className="mt-1">
            <ProductCombobox
              products={products}
              selectedProductId={purchase.product_id}
              productName={purchase.product_name}
              onSelect={handleProductSelect}
            />
          </div>
        </div>

        {/* Date + Prazo */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor={`purchase-${index}-date`} className="text-xs font-medium">
              Data da Compra *
            </Label>
            <Input
              id={`purchase-${index}-date`}
              type="date"
              value={purchase.data_compra}
              onChange={(e) => onChange(index, 'data_compra', e.target.value)}
              className="mt-1 h-8"
            />
          </div>

          <div>
            <Label htmlFor={`purchase-${index}-prazo`} className="text-xs font-medium">
              Prazo Recompra (dias) *
            </Label>
            <Input
              id={`purchase-${index}-prazo`}
              type="number"
              min="1"
              value={purchase.prazo_recompra}
              onChange={(e) => onChange(index, 'prazo_recompra', parseInt(e.target.value) || 1)}
              className="mt-1 h-8"
              placeholder="30"
            />
          </div>
        </div>

        {/* Preview dates */}
        {purchase.data_compra && (
          <div className="text-xs text-muted-foreground bg-green-50 dark:bg-green-900/20 p-2 rounded border border-green-200 dark:border-green-800">
            ✓ Próxima recompra calculada automaticamente
          </div>
        )}
      </div>
    </div>
  );
}

export const CompraForm = memo(CompraFormComponent);
