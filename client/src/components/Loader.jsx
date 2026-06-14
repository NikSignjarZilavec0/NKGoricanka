/** Small spinner. `full` centers it in a tall area. */
export default function Loader({ full = false, text }) {
  return (
    <div className={full ? 'loader-full' : 'loading-wrap'}>
      <div className="spinner" />
      {text && <p className="text-muted">{text}</p>}
    </div>
  );
}
