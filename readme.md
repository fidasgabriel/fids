# Fids Transpiler

A **transpiler** that converts code written in the **Fids** language into **TypeScript**, including static typing, keyword translation, loops, functions, promises, and generics.

---

## 🔹 Features

- **Supported types:** `int`, `float`, `bool`, `string`, `void`.
- **Variable conversion:** `dec type name = value` → `const name: type = value`.
- **Typed for-loops:** `for(int i = 0; i < n; i++)` → `for (let i: number = 0; i < n; i++)`.
- **Functions:** `bool func test(int n)` → `function test(n: number): boolean`.
- **Generics and Lists:** support for `List<T>` and other generic types.
- **Keyword replacements:**
  - `log()` → `prints a message at console/terminal`
  - `otw if` → `otherwise/else if`
  - `otw` → `otherwise/else`
  - `look` → `conditional select that directs the flux of the code (switch/match)`
  - `when` → `conditional select validation (case)`
  - `keep` → `keep the current loop, but jumps to next iteration (continue)`

---

## 🔹 Installation

Requires Node.js and TypeScript.

```bash
npm install
```

## 🔹 Usage

```bash
npx ts-node transpiler.ts <file.fids> > index.ts
npx ts-node index.ts
```

## 🔹 Hello world

Create a file named index.fids

```bash
//fids content
log("Hello world!")
log("Using Fids programming language")
```

## 🔹 Objectives

This is a start of my new programming language (2025).

The goal is to learn and practice some concepts of base structures, data, algorithms and improve them.

I'm a brasilian 18 years old student/programmer. Be welcome to fork this repo if you want to collaborate.

My social media:

LinkedIn: https://www.linkedin.com/in/gabriel-fidalgo-938a38248/
GitHub: https://github.com/FidalgoGab

© FIids - All rights reserved
