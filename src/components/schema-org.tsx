'use client';

import { useEffect } from 'react';

interface SchemaOrgProps {
  schema: Record<string, unknown>;
}

export function SchemaOrg({ schema }: SchemaOrgProps) {
  useEffect(() => {
    const existingScript = document.getElementById('schema-org-script');
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.id = 'schema-org-script';
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schema);
    document.body.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById('schema-org-script');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [schema]);

  return null;
}
