export type RecurrenceTab = "subscriptions" | "fixed-expenses" | "fixed-incomes";

const tabs: Array<{ id: RecurrenceTab; label: string }> = [
  { id: "subscriptions", label: "Assinaturas" },
  { id: "fixed-expenses", label: "Gastos fixos" },
  { id: "fixed-incomes", label: "Rendas fixas" },
];

type RecurrencesTabsProps = {
  activeTab: RecurrenceTab;
  onChange: (tab: RecurrenceTab) => void;
};

export function RecurrencesTabs({ activeTab, onChange }: RecurrencesTabsProps) {
  return (
    <div aria-label="Tipo de recorrência" className="rcx-tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          aria-selected={activeTab === tab.id}
          id={`recurrences-tab-${tab.id}`}
          key={tab.id}
          onClick={() => onChange(tab.id)}
          role="tab"
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
