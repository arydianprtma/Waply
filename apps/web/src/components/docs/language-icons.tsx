import React from "react";

// Official Flutter Logo
export function FlutterIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <img
      src="/icons/languages/flutter.svg"
      alt="Flutter"
      className={`${className} object-contain`}
      loading="lazy"
    />
  );
}

// Official Node.js Logo
export function NodejsIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <img
      src="/icons/languages/nodejs.svg"
      alt="Node.js"
      className={`${className} object-contain`}
      loading="lazy"
    />
  );
}

// Official PHP Logo
export function PhpIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <img
      src="/icons/languages/php.svg"
      alt="PHP"
      className={`${className} object-contain`}
      loading="lazy"
    />
  );
}

// Official Laravel Logo
export function LaravelIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <img
      src="/icons/languages/laravel.svg"
      alt="Laravel"
      className={`${className} object-contain`}
      loading="lazy"
    />
  );
}

// Official Python Logo
export function PythonIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <img
      src="/icons/languages/python.svg"
      alt="Python"
      className={`${className} object-contain`}
      loading="lazy"
    />
  );
}

// Official Golang Logo
export function GolangIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <img
      src="/icons/languages/go.svg"
      alt="Golang"
      className={`${className} object-contain`}
      loading="lazy"
    />
  );
}

// Official Kotlin Logo
export function KotlinIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <img
      src="/icons/languages/kotlin.svg"
      alt="Kotlin"
      className={`${className} object-contain`}
      loading="lazy"
    />
  );
}

// Official C# / .NET Logo
export function CsharpIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <img
      src="/icons/languages/csharp.svg"
      alt="C#"
      className={`${className} object-contain`}
      loading="lazy"
    />
  );
}
