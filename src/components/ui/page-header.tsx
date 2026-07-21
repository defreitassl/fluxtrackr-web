type PageHeaderProps = {
  eyebrow: string;
  title: string;
  titleId?: string;
  description: string;
};

export function PageHeader({ eyebrow, title, titleId, description }: PageHeaderProps) {
  return (
    <header className="page-header">
      <p className="page-eyebrow">{eyebrow}</p>
      <h1 id={titleId}>{title}</h1>
      <p>{description}</p>
    </header>
  );
}
