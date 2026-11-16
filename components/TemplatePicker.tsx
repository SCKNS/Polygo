"use client";

import { cellsInView, outlinePath, TEMPLATE_GROUPS, TEMPLATES } from "@/lib/templates";
import { usePaintStore } from "@/lib/paintStore";

// Önizlemede görünen alan, dünya biriminde. Her şablon aynı ölçekte görünür, böylece hücre boyları karşılaştırılabilir.
const PREVIEW_SIZE = 3;

// Önizlemeler şablon verisinden bir kez üretilir: tuvalde ne çiziliyorsa küçük hali odur.
const PREVIEWS = TEMPLATES.map((template) => ({
  template,
  path: outlinePath(cellsInView(template, { left: 0, top: 0, right: PREVIEW_SIZE, bottom: PREVIEW_SIZE })),
}));

export function TemplatePicker() {
  const templateId = usePaintStore((state) => state.templateId);
  const setTemplate = usePaintStore((state) => state.setTemplate);

  return <>
    <p className="panel-note">şablon seç</p>
    {TEMPLATE_GROUPS.map((group) => (
      <section key={group} className="template-group">
        <h3>{group}</h3>
        <div className="template-grid" role="group" aria-label={`${group} şablonları`}>
          {PREVIEWS.filter(({ template }) => template.group === group).map(({ template, path }) => {
            const selected = template.id === templateId;
            return (
              <button key={template.id} type="button" className="template-option" aria-pressed={selected} data-template={template.id}
                onClick={() => setTemplate(template.id)}>
                <svg className="mini-grid" viewBox={`0 0 ${PREVIEW_SIZE} ${PREVIEW_SIZE}`} aria-hidden="true">
                  <path d={path} vectorEffect="non-scaling-stroke" />
                </svg>
                <span>{template.name}</span>
                {selected && <span className="selected-indicator" aria-hidden="true">✓</span>}
              </button>
            );
          })}
        </div>
      </section>
    ))}
    <p className="panel-footnote">şablon değişince tuval boşalır; geri al ile önceki çizime dönersin.</p>
  </>;
}
