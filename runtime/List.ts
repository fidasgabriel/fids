// runtime/setup.ts
import FidsPromise from "./FidsPromise";

// 🔹 Deixar Promise global
(globalThis as any).FidsPromise = FidsPromise;

// 🔹 Classe List<T> com métodos nativos
export default class List<T> extends Array<T> {
  // Pega o primeiro elemento
  get first(): T | undefined {
    return this.get(0);
  }

  // Pega o último elemento
  get last(): T | undefined {
    return this.get(this.size() - 1);
  }

  // Pega elemento pelo índice
  get(index: number): T | undefined {
    return this[index];
  }

  // Adiciona um elemento; se passar index, insere nesse índice
  add(item: T, index?: number): void {
    if (index === undefined || index >= this.length) {
      this.push(item);
    } else {
      this.splice(index, 0, item);
    }
  }

  // Remove elemento pelo índice
  removeAt(index: number): void {
    if (index >= 0 && index < this.length) this.splice(index, 1);
  }

  // Remove todos os elementos que satisfazem a condição
  removeWhere(fn: (v: T, i: number) => boolean): void {
    for (let i = this.length - 1; i >= 0; i--) {
      if (fn(this[i], i)) this.splice(i, 1);
    }
  }

  // Retorna tamanho
  size(): number {
    return this.length;
  }

  // Bubble sort customizado com condição
  bubbleSort(compareFn?: (a: T, b: T) => number): List<T> {
    const arr = [...this];
    const n = arr.length;

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        const shouldSwap = compareFn
          ? compareFn(arr[j], arr[j + 1]) > 0
          : String(arr[j]) > String(arr[j + 1]); // fallback para strings/numbers

        if (shouldSwap) {
          const tmp = arr[j];
          arr[j] = arr[j + 1];
          arr[j + 1] = tmp;
        }
      }
    }

    return new List<T>(...arr);
  }

  // Iteração amigável
  each(fn: (v: T, i: number) => void): void {
    super.forEach(fn);
  }
}

// 🔹 Deixar List global
(globalThis as any).List = List;
