/**
 * Dominio `forms` (`@vsadtajo/adasa-ui/forms`): primitivas de formulario
 * sin framework de UI. Solo depende de `core` (ver docs/adr/0000-estructura-paquete.md).
 */

export { default as ASFormField } from './components/ASFormField.vue'
export { default as ASButton } from './components/ASButton.vue'
export { default as ASIconButton } from './components/ASIconButton.vue'
export { default as ASInput } from './components/ASInput.vue'
export { default as ASSelect } from './components/ASSelect.vue'
export { default as ASCheckbox } from './components/ASCheckbox.vue'
export { default as ASSwitch } from './components/ASSwitch.vue'
export { default as ASRadioGroup } from './components/ASRadioGroup.vue'
export { default as ASDatePicker } from './components/ASDatePicker.vue'
export { default as ASDateRangePicker } from './components/ASDateRangePicker.vue'
export { default as ASSearchInput } from './components/ASSearchInput.vue'

export { hydrologicalYearStart } from './utils/dates'

export type {
  ButtonVariant,
  ControlSize,
  FieldProps,
  SelectGroup,
  SelectOption,
  SelectValue,
} from './types/common'
export type { FormFieldProps, FormFieldSlotProps } from './types/FormFieldProps'
export type { ButtonEmits, ButtonProps } from './types/ButtonProps'
export type { IconButtonEmits, IconButtonProps } from './types/IconButtonProps'
export type { InputEmits, InputProps, InputType } from './types/InputProps'
export type {
  SelectChipSlotProps,
  SelectEmits,
  SelectOptionSlotProps,
  SelectProps,
} from './types/SelectProps'
export type { CheckboxEmits, CheckboxProps } from './types/CheckboxProps'
export type { SwitchEmits, SwitchProps } from './types/SwitchProps'
export type { RadioGroupEmits, RadioGroupProps } from './types/RadioGroupProps'
export type { DatePickerEmits, DatePickerProps } from './types/DatePickerProps'
export type {
  DateRange,
  DateRangePickerEmits,
  DateRangePickerProps,
  DateRangePreset,
  DateRangePresetId,
} from './types/DateRangePickerProps'
export type {
  FetchSuggestions,
  SearchInputEmits,
  SearchInputProps,
  SearchSuggestion,
} from './types/SearchInputProps'
