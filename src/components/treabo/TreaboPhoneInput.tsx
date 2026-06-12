import 'react-phone-input-2/lib/style.css';
import ReactPhone from 'react-phone-input-2';
import { TREABO_PHONE_COUNTRY } from '@/lib/treabo/phone';

type TreaboPhoneInputProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
};

export default function TreaboPhoneInput({
  value,
  onChange,
  className,
  disabled,
}: TreaboPhoneInputProps) {
  return (
    <div className={className}>
      <ReactPhone
        country={TREABO_PHONE_COUNTRY}
        onlyCountries={[TREABO_PHONE_COUNTRY]}
        countryCodeEditable={false}
        enableSearch={false}
        value={value}
        disabled={disabled}
        onChange={(next) => onChange(next)}
        inputClass="!w-full !h-12 !rounded-2xl !border-zinc-200 !bg-white !text-[#232323] !text-base"
        buttonClass="!rounded-l-2xl !border-zinc-200 !bg-zinc-50"
        containerClass="treabo-phone-input"
      />
    </div>
  );
}
