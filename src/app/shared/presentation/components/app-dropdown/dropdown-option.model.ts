import { AccessPermission } from '../../../../iam/domain/model/access-permission.model';

export interface DropdownOption {
  label: string;
  labelKey?: string;
  value: string;
  route?: string;
  aliases?: string[];
  description?: string;
  descriptionKey?: string;
  disabled?: boolean;
  emptyState?: boolean;
  requiredPermission?: AccessPermission;
}
