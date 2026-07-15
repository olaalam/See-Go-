import React from 'react';

export default function TitleSection({ text }) {
  return (
    <h2 className="text-bg-primary text-center !pb-10 text-xl font-semibold !mb-10">
      {text}
    </h2>
  );
}
