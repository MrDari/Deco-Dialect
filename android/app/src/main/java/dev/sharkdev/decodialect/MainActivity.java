package dev.sharkdev.decodialect;

import android.os.Bundle;
import android.view.View;
import android.webkit.WebView;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.BridgeActivity;

/**
 * Edge-to-edge: el juego se dibuja bajo las barras del sistema (status + navegacion)
 * para conservar el fondo neon a pantalla completa.
 *
 * Problema que resuelve esta clase: en Android la funcion CSS env(safe-area-inset-*)
 * SOLO refleja el recorte de pantalla (notch/cutout), NO la barra de navegacion
 * (botones atras/home/recientes ni la barra de gestos). Como casi ningun movil tiene
 * cutout inferior, env(safe-area-inset-bottom) valia 0 y el boton MENU quedaba debajo
 * de los botones de Android.
 *
 * Solucion: leemos los insets reales del sistema y los inyectamos en las MISMAS
 * variables CSS que ya usa el layout (--safe-t/-r/-b/-l). Asi funciona en cualquier
 * modelo: barra de 3 botones, barra de gestos, notch, isla o bordes redondeados.
 */
public class MainActivity extends BridgeActivity {

    // Ultimos insets calculados (en CSS px). Se reinyectan en onResume por si la
    // primera pasada de insets llego antes de que la WebView cargara el documento.
    private int safeTop, safeRight, safeBottom, safeLeft;
    private boolean haveInsets = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        final View root = getWindow().getDecorView();

        ViewCompat.setOnApplyWindowInsetsListener(root, (v, windowInsets) -> {
            // Union de barras del sistema (status + navegacion) y del recorte de pantalla.
            Insets bars = windowInsets.getInsets(
                    WindowInsetsCompat.Type.systemBars()
                            | WindowInsetsCompat.Type.displayCutout());

            float density = getResources().getDisplayMetrics().density;
            if (density <= 0f) density = 1f;

            // Los insets vienen en px fisicos; el CSS trabaja en px logicos (CSS px).
            safeTop    = Math.round(bars.top / density);
            safeRight  = Math.round(bars.right / density);
            safeBottom = Math.round(bars.bottom / density);
            safeLeft   = Math.round(bars.left / density);
            haveInsets = true;

            injectSafeAreas(safeTop, safeRight, safeBottom, safeLeft);

            // No consumimos los insets: dejamos que el resto del arbol los reciba.
            return windowInsets;
        });

        // Forzar una primera pasada de insets cuando la vista ya este adjunta.
        ViewCompat.requestApplyInsets(root);
    }

    @Override
    public void onResume() {
        super.onResume();
        // La WebView ya tiene el documento cargado: reaplicamos por si la primera
        // pasada (en onCreate) corrio antes de que existiera documentElement.
        if (haveInsets) {
            injectSafeAreas(safeTop, safeRight, safeBottom, safeLeft);
        }
        ViewCompat.requestApplyInsets(getWindow().getDecorView());
    }

    private void injectSafeAreas(final int top, final int right, final int bottom, final int left) {
        final WebView webView = this.bridge != null ? this.bridge.getWebView() : null;
        if (webView == null) return;

        final String js =
                "(function(){var s=document.documentElement.style;" +
                "s.setProperty('--safe-t','" + top + "px');" +
                "s.setProperty('--safe-r','" + right + "px');" +
                "s.setProperty('--safe-b','" + bottom + "px');" +
                "s.setProperty('--safe-l','" + left + "px');})();";

        webView.post(() -> webView.evaluateJavascript(js, null));
    }
}
