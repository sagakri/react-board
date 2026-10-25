import { type ChangeEvent, type FormEvent, useCallback, useEffect, useState } from "react";

import type { Ad, AdsResponse } from "./types";
import { API_URL, formatPrice, getImageUrl } from "./utils";
import "./App.css";

type FormMessage = { text: string; type: "success" | "error" } | null;

export default function App() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<FormMessage>(null);

  const loadAds = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/ads`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as AdsResponse;
      const items = data.items ?? [];
      setAds(items);
      setTotal(data.total ?? items.length);
    } catch (requestError) {
      console.error("GET /ads failed:", requestError);
      setAds([]);
      setTotal(0);
      setError("Не удалось загрузить объявления. Проверьте соединение и попробуйте ещё раз.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAds();
  }, [loadAds]);

  useEffect(() => {
    if (!image) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(image);
    setPreviewUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [image]);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;
    if (selectedFile && !selectedFile.type.startsWith("image/")) {
      setMessage({ text: "Можно выбрать только файл изображения.", type: "error" });
      event.target.value = "";
      return;
    }
    setImage(selectedFile);
    setMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !description.trim() || !price || !image) {
      setMessage({ text: "Заполните название, описание, цену и добавьте изображение.", type: "error" });
      return;
    }
    setIsSubmitting(true);
    setMessage({ text: "Публикуем объявление…", type: "success" });
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("price", price);
      formData.append("image", image);
      const response = await fetch(`${API_URL}/ads`, { method: "POST", body: formData });
      if (!response.ok) throw new Error(`Сервер вернул ошибку HTTP ${response.status}.`);
      setTitle("");
      setDescription("");
      setPrice("");
      setImage(null);
      setMessage({ text: "Объявление опубликовано.", type: "success" });
      await loadAds();
    } catch (requestError) {
      const text = requestError instanceof Error ? requestError.message : "Не удалось опубликовать объявление.";
      setMessage({ text, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="header">
        <div>
          <p className="eyebrow">LOCAL MARKETPLACE</p>
          <h1>Info Board</h1>
          <p className="subtitle">доска объявлений</p>
        </div>
        <button className="secondary-button" type="button" onClick={() => void loadAds()} disabled={isLoading}>
          {isLoading ? "Обновляем…" : "Обновить"}
        </button>
      </header>
      <main className="content-grid">
        <section className="panel form-panel" aria-labelledby="new-ad-title">
          <div className="panel-title"><p className="eyebrow">NEW LISTING</p><h2 id="new-ad-title">Новое объявление</h2></div>
          <form onSubmit={handleSubmit}>
            <label>Название<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Например, велосипед" required /></label>
            <label>Описание<textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Коротко расскажите о товаре" required /></label>
            <label>Цена, KGS<input type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="25000" required /></label>
            <label className="file-label">Изображение<input type="file" accept="image/*" onChange={handleImageChange} required /></label>
            {previewUrl && <img className="preview" src={previewUrl} alt="Предпросмотр выбранного изображения" />}
            {message && <p className={`message ${message.type}`}>{message.text}</p>}
            <button className="primary-button" type="submit" disabled={isSubmitting}>{isSubmitting ? "Публикуем…" : "Опубликовать"}</button>
          </form>
        </section>
        <section className="ads-section" aria-labelledby="ads-title">
          <div className="ads-header"><div><p className="eyebrow">CATALOGUE</p><h2 id="ads-title">Объявления</h2></div><span className="counter">{total}</span></div>
          {isLoading && <div className="state-card">Загружаем объявления…</div>}
          {!isLoading && error && <div className="state-card error-state">{error}</div>}
          {!isLoading && !error && ads.length === 0 && <div className="state-card">Объявлений пока нет.</div>}
          {!isLoading && !error && ads.length > 0 && <div className="ads-grid">{ads.map((ad) => <article className="ad-card" key={ad.id}><div className="image-wrap">{ad.image_url ? <img src={getImageUrl(ad.image_url)} alt={ad.title} /> : <span>Нет изображения</span>}</div><div className="ad-content"><h3>{ad.title}</h3><p>{ad.description}</p><strong>{formatPrice(ad.price)}</strong><small>Объявление #{ad.id}</small></div></article>)}</div>}
        </section>
      </main>
    </div>
  );
}
