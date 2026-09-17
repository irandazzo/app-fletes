// ==========================================
// CONFIGURACIÓN E INICIALIZACIÓN DE FIREBASE
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyAz56gxrDX_bY4bQ_kN7UFTjrpf2LVlFnk",
    authDomain: "fletarg-db.firebaseapp.com",
    projectId: "fletarg-db",
    storageBucket: "fletarg-db.firebasestorage.app",
    messagingSenderId: "621620714229",
    appId: "1:621620714229:web:b2cef10225322f5d07c3bc"
};

// Inicializar Firebase y los servicios que vamos a usar
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();


document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 0. PROTECCIÓN DE RUTAS SEGÚN EL ROL
    // ==========================================
    const path = window.location.pathname;
    const emailActivo = localStorage.getItem('fletarg_usuario_activo');

    if ((path.includes('cliente') || path.includes('proveedor') || path.includes('perfil')) && !emailActivo) {
        window.location.href = 'index.html';
        return;
    }

    if (emailActivo) {
        const usuarioActivo = JSON.parse(localStorage.getItem(emailActivo));
        if (usuarioActivo) {
            if (usuarioActivo.rol === 'cliente' && path.includes('proveedor')) {
                window.location.href = 'cliente.html';
                return;
            }
            if (usuarioActivo.rol === 'proveedor' && (path.includes('cliente.html') || path.includes('cliente-viajes.html'))) {
                window.location.href = 'proveedor-perfil.html';
                return;
            }
        }
    }
    
    // ==========================================
    // 1. SELECCIÓN DE VEHÍCULOS (Cliente)
    // ==========================================
    const tarjetasVehiculo = document.querySelectorAll('.opcion-card');
    if (tarjetasVehiculo.length > 0) {
        tarjetasVehiculo.forEach(tarjeta => {
            tarjeta.addEventListener('click', () => {
                tarjetasVehiculo.forEach(t => t.classList.remove('activa'));
                tarjeta.classList.add('activa');
            });
        });
    }

    // ==========================================
   // 2. SELECCIÓN DE TIEMPO (Botones interactivos)
    // ==========================================
    const botonesCuando = document.querySelectorAll('.btn-opcion-cuando');
    const inputTipoViajeSel = document.getElementById('tipo-viaje-seleccion');
    const contenedorFecha = document.getElementById("contenedor-fecha");
    const inputFechaProgramada = document.getElementById("fecha-programada");
    const textoFechaElegida = document.getElementById("texto-fecha-elegida");

    botonesКогда = botonesCuando; // por compatibilidad
    botonesCuando.forEach(boton => {
        boton.addEventListener('click', (e) => {
            botonesCuando.forEach(b => b.classList.remove('activo'));
            e.target.classList.add('activo');

            const valorElegido = e.target.getAttribute('data-valor');
            if (inputTipoViajeSel) inputTipoViajeSel.value = valorElegido;

            if (valorElegido === 'programado') {
                if (contenedorFecha) contenedorFecha.style.display = "block";
                
                // Bloquear visualmente en el calendario del navegador cualquier fecha/hora pasada
                if (inputFechaProgramada) {
                    const ahora = new Date();
                    const anio = ahora.getFullYear();
                    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
                    const dia = String(ahora.getDate()).padStart(2, '0');
                    const hora = String(ahora.getHours()).padStart(2, '0');
                    const min = String(ahora.getMinutes()).padStart(2, '0');
                    
                    inputFechaProgramada.min = `${anio}-${mes}-${dia}T${hora}:${min}`;
                }
            } else {
                if (contenedorFecha) contenedorFecha.style.display = "none";
                if (inputFechaProgramada) inputFechaProgramada.value = "";
                if (textoFechaElegida) {
                    textoFechaElegida.style.display = 'none';
                    textoFechaElegida.innerText = '';
                }
            }
        });
    });

    if (inputFechaProgramada) {
        inputFechaProgramada.addEventListener("change", (e) => {
            const valor = e.target.value;
            if (valor && textoFechaElegida) {
                const fechaObj = new Date(valor);
                const fechaLegible = fechaObj.toLocaleString('es-AR', { 
                    day: '2-digit', month: '2-digit', year: 'numeric', 
                    hour: '2-digit', minute: '2-digit' 
                });

                textoFechaElegida.innerText = `✔️ Fecha programada: ${fechaLegible}`;
                textoFechaElegida.style.display = 'block';
            }
        });
    }
    // ==========================================
    // 3. SERVICIOS ADICIONALES (Peón y Escalera)
    // ==========================================
    const checkPeon = document.getElementById("peon");
    const contPeon = document.getElementById("peon-cantidad-container");
    if (checkPeon && contPeon) {
        checkPeon.addEventListener("change", (e) => {
            if (e.target.checked) {
                contPeon.style.display = "flex";
                checkPeon.closest('.check-item').classList.add("abierto");
            } else {
                contPeon.style.display = "none";
                checkPeon.closest('.check-item').classList.remove("abierto");
            }
        });
    }

    const checkEscalera = document.getElementById("escalera");
    const contEscalera = document.getElementById("escalera-pisos-container");
    if (checkEscalera && contEscalera) {
        checkEscalera.addEventListener("change", (e) => {
            if (e.target.checked) {
                contEscalera.style.display = "flex";
                checkEscalera.closest('.check-item').classList.add("abierto");
            } else {
                contEscalera.style.display = "none";
                checkEscalera.closest('.check-item').classList.remove("abierto");
            }
        });
    }

    // ==========================================
    // 4. AUTOCOMPLETADO DE DIRECCIONES (Photon API)
    // ==========================================
    function configurarAutocompletado(inputId) {
        const input = document.getElementById(inputId);
        if (!input) return;
        
        const formGroup = input.parentElement;
        const sugerenciasBox = document.createElement('div');
        sugerenciasBox.className = 'sugerencias-box';
        formGroup.appendChild(sugerenciasBox);

        let timeoutId;

        input.addEventListener('input', (e) => {
            const query = e.target.value;
            clearTimeout(timeoutId);
            
            if (query.length < 3) {
                sugerenciasBox.style.display = 'none';
                return;
            }

            timeoutId = setTimeout(async () => {
                try {
                    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lat=-34.6037&lon=-58.3816`;
                    const respuesta = await fetch(url);
                    const datos = await respuesta.json();

                    sugerenciasBox.innerHTML = '';
                    
                    if (datos.features.length > 0) {
                        sugerenciasBox.style.display = 'block';
                        datos.features.forEach(feature => {
                            const prop = feature.properties;
                            const item = document.createElement('div');
                            item.className = 'sugerencia-item';
                            
                            const nombre = prop.name ? prop.name + ', ' : '';
                            const calle = prop.street ? prop.street + ', ' : '';
                            const ciudad = prop.city || prop.state || '';
                            
                            item.textContent = `${nombre}${calle}${ciudad}`;
                            item.addEventListener('click', () => {
                                input.value = item.textContent;
                                sugerenciasBox.style.display = 'none';
                            });
                            sugerenciasBox.appendChild(item);
                        });
                    } else {
                        sugerenciasBox.style.display = 'none';
                    }
                } catch (error) {
                    console.error("Error buscando dirección:", error);
                }
            }, 300);
        });

        document.addEventListener('click', (e) => {
            if (e.target !== input && e.target !== sugerenciasBox) {
                sugerenciasBox.style.display = 'none';
            }
        });
    }

    configurarAutocompletado('origen');
    configurarAutocompletado('destino');

    // ==========================================
    // ==========================================
    // 5. REGISTRO DE USUARIOS (Con Firebase Cloud)
    // ==========================================
    const formRegistro = document.getElementById('form-registro');
    if (formRegistro) {
        formRegistro.addEventListener('submit', async (evento) => {
            evento.preventDefault();
            const nombre = document.getElementById('nombre').value.trim();
            const apellido = document.getElementById('apellido').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('contrasena-reg').value.trim();
            const rol = document.getElementById('rol-elegido').value;

            try {
                // 1. Crear el usuario en Firebase Authentication
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                const uid = userCredential.user.uid;

                // 2. Preparar los datos adicionales del usuario
                let datosUsuario = {
                    uid: uid,
                    nombre: nombre,
                    apellido: apellido,
                    email: email,
                    rol: rol,
                    fechaCreacion: new Date().toISOString()
                };

                // Si es proveedor, guardamos sus tarifas personalizadas
                if (rol === 'proveedor') {
                    datosUsuario.tarifas = {
                        precioKm: parseFloat(document.getElementById('precio-km').value) || 0,
                        precioPiso: parseFloat(document.getElementById('precio-piso').value) || 0,
                        ofrecePeon: document.getElementById('ofrece-peon').value,
                        precioPeon: parseFloat(document.getElementById('precio-peon').value) || 0,
                        negociar: document.getElementById('acepta-negociar').value
                    };
                }

                // 3. Guardar el documento completo en la colección "usuarios" de Firestore
                await db.collection("usuarios").doc(email).set(datosUsuario);

                // 4. Guardar sesión activa localmente para la interfaz y redirigir
                localStorage.setItem('fletarg_usuario_activo', email);

                alert('¡Cuenta creada con éxito en la nube! Redirigiendo a tu panel...');

                if (rol === 'cliente') {
                    window.location.href = 'cliente.html';
                } else if (rol === 'proveedor') {
                    window.location.href = 'proveedor-perfil.html';
                }

            } catch (error) {
                console.error("Error en el registro:", error);
                if (error.code === 'auth/email-already-in-use') {
                    alert('⚠️ Error: Ya existe una cuenta registrada con este correo electrónico.');
                } else if (error.code === 'auth/weak-password') {
                    alert('⚠️ Error: La contraseña debe tener al menos 6 caracteres.');
                } else {
                    alert('⚠️ Error al registrar: ' + error.message);
                }
            }
        });
    }
    // ==========================================
    // ==========================================
    // 6. INICIO DE SESIÓN (LOGIN)
    // ==========================================
    const formLogin = document.getElementById('form-login');
    if (formLogin) {
        formLogin.addEventListener('submit', (evento) => {
            evento.preventDefault();
            const emailIngresado = document.getElementById('usuario').value.trim();
            const passwordIngresada = document.getElementById('contrasena').value.trim();

            const datosUsuarioGuardado = localStorage.getItem(emailIngresado);
            if (!datosUsuarioGuardado) {
                alert('⚠️ Error: No existe una cuenta registrada con este correo.');
                return;
            }

            const usuario = JSON.parse(datosUsuarioGuardado);
            if (usuario.password !== passwordIngresada) {
                alert('⚠️ Error: Contraseña incorrecta.');
                return;
            }

            // Guardar sesión activa
            localStorage.setItem('fletarg_usuario_activo', emailIngresado);

            // AUDITORÍA: Registrar el inicio de sesión exitoso de forma segura
            if (typeof registrarAccionEnBitacora === 'function') {
                registrarAccionEnBitacora('LOGIN', `Inicio de sesión exitoso (${usuario.rol})`, emailIngresado);
            }

            // Redireccionar según el rol
            if (usuario.rol === 'cliente') {
                window.location.href = 'cliente.html';
            } else if (usuario.rol === 'proveedor') {
                window.location.href = 'proveedor-perfil.html';
            }
        });
    }
    // ==========================================
// ==========================================
    // 7. FLUJO DE RESUMEN Y MODAL DE CONFIRMACIÓN (Cliente)
    // ==========================================
    const btnCotizar = document.querySelector('.panel-pedido .btn-principal');
    const modalConfirmacion = document.getElementById('modal-confirmacion');
    const btnCancelarModal = document.getElementById('btn-cancelar-modal'); 
    const btnConfirmarViaje = document.getElementById('btn-confirmar-viaje'); 
    const modalDetalles = document.getElementById('modal-detalles');

    let datosViajeTemporal = null;

    if (btnCotizar && document.body.classList.contains('body-cliente')) {
        btnCotizar.addEventListener('click', () => {
            const origenInput = document.getElementById('origen');
            const destinoInput = document.getElementById('destino');
            const vehiculoActivo = document.querySelector('.opcion-card.activa .nombre-vehiculo');
            const inputTipoViajeSel = document.getElementById('tipo-viaje-seleccion');
            const inputFechaProgramada = document.getElementById('fecha-programada');

            const origen = origenInput ? origenInput.value.trim() : '';
            const destino = destinoInput ? destinoInput.value.trim() : '';
            const tipoVehiculo = vehiculoActivo ? vehiculoActivo.innerText : 'Moto';

            if (!origen || !destino) {
                alert('⚠️ Por favor, completá la dirección de origen y de destino.');
                return;
            }

            const tipoViajeVal = inputTipoViajeSel ? inputTipoViajeSel.value : '';
            const fechaInputVal = inputFechaProgramada ? inputFechaProgramada.value.trim() : '';

            if (!tipoViajeVal) {
                alert('⚠️ Por favor, indicá cuándo necesitás el flete (Lo antes posible o Programar).');
                return;
            }

            if (tipoViajeVal === 'programado' && !fechaInputVal) {
                alert('⚠️ Seleccionaste viaje programado, por favor elegí una fecha y hora.');
                return;
            }

            // Validar estrictamente que la fecha/hora programada no sea en el pasado
            if (tipoViajeVal === 'programado' && fechaInputVal) {
                const fechaSeleccionada = new Date(fechaInputVal).getTime();
                const fechaActual = new Date().getTime();

                if (fechaSeleccionada < fechaActual) {
                    alert('⚠️ No podés programar un flete en el pasado. Elegí una fecha y hora válida.');
                    return;
                }
            }

            let proveedores = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.includes('@')) {
                    try {
                        const usuario = JSON.parse(localStorage.getItem(key));
                        if (usuario && usuario.rol === 'proveedor' && usuario.tarifas) {
                            proveedores.push(usuario);
                        }
                    } catch (e) {}
                }
            }

            let precioBase = 12000;
            if (tipoVehiculo === 'Pickup') precioBase = 25000;
            if (tipoVehiculo === 'Camión') precioBase = 45000;
            if (tipoVehiculo === 'Auto') precioBase = 16000;
            if (tipoVehiculo === 'Utilitario') precioBase = 32000;

            let costoPisoUnitario = 3000;
            let costoPeonUnitario = 8000;

            if (proveedores.length > 0) {
                const provEjemplo = proveedores[0];
                if (provEjemplo.tarifas.precioKm) precioBase = provEjemplo.tarifas.precioKm * 15;
                if (provEjemplo.tarifas.precioPiso) costoPisoUnitario = provEjemplo.tarifas.precioPiso;
                if (provEjemplo.tarifas.precioPeon) costoPeonUnitario = provEjemplo.tarifas.precioPeon;
            }

            const quierePeon = document.getElementById('peon').checked;
            const cantPeones = parseInt(document.getElementById('cantidad-peones').value) || 1;
            let costoPeon = quierePeon ? (cantPeones * costoPeonUnitario) : 0; 

            const hayEscalera = document.getElementById('escalera').checked;
            const cantPisos = parseInt(document.getElementById('cantidad-pisos').value) || 1;
            let costoEscalera = hayEscalera ? (cantPisos * costoPisoUnitario) : 0; 

            const precioTotalNum = precioBase + costoPeon + costoEscalera;
            const precioFormateado = `$ ${precioTotalNum.toLocaleString('es-AR')}`;

            const cargaVal = document.getElementById('detalle-carga').value.trim() || 'Sin especificar';
            const pagoVal = document.getElementById('metodo-pago').value;
            
            let textoFechaHora = '⚡ Lo antes posible';
            if (tipoViajeVal === 'programado' && fechaInputVal) {
                const fechaObj = new Date(fechaInputVal);
                textoFechaHora = fechaObj.toLocaleString('es-AR', { 
                    day: '2-digit', month: '2-digit', year: 'numeric', 
                    hour: '2-digit', minute: '2-digit' 
                });
            }

            datosViajeTemporal = {
                id: Date.now(),
                origen,
                destino,
                vehiculo: tipoVehiculo,
                precio: precioFormateado,
                estado: 'pendiente',
                detallesExtra: {
                    tipoViaje: textoFechaHora,
                    peones: quierePeon ? `${cantPeones} ayudante(s) ($ ${costoPeon.toLocaleString('es-AR')})` : 'No',
                    escalera: hayEscalera ? `${cantPisos} piso(s) ($ ${costoEscalera.toLocaleString('es-AR')})` : 'No',
                    carga: cargaVal,
                    pago: pagoVal
                }
            };

            if (modalDetalles) {
                modalDetalles.innerHTML = `
                    <p><strong>Vehículo:</strong> ${tipoVehiculo}</p>
                    <p>📍 <strong>Origen:</strong> ${origen}</p>
                    <p>🏁 <strong>Destino:</strong> ${destino}</p>
                    <p>📅 <strong>Cuándo:</strong> ${textoFechaHora}</p>
                    <p>👷 <strong>Peones:</strong> ${datosViajeTemporal.detallesExtra.peones}</p>
                    <p>🪜 <strong>Escalera:</strong> ${datosViajeTemporal.detallesExtra.escalera}</p>
                    <p>📦 <strong>Carga:</strong> ${cargaVal}</p>
                    <p>💳 <strong>Pago:</strong> ${pagoVal.toUpperCase()}</p>
                    <hr style="margin: 10px 0; border:0; border-top:1px solid #eee;">
                    <p style="font-size: 16px; color: #28a745; text-align: right;"><strong>Total Estimado: ${precioFormateado}</strong></p>
                `;
            }

            if (modalConfirmacion) {
                modalConfirmacion.classList.remove('oculto');
            }
        });
    }

    if (btnCancelarModal) {
        btnCancelarModal.addEventListener('click', () => {
            modalConfirmacion.classList.add('oculto');
            datosViajeTemporal = null;
        });
    }

    if (btnConfirmarViaje) {
        btnConfirmarViaje.addEventListener('click', () => {
            if (!datosViajeTemporal) return;

            let viajes = JSON.parse(localStorage.getItem('fletarg_viajes')) || [];
            viajes.push(datosViajeTemporal);
            localStorage.setItem('fletarg_viajes', JSON.stringify(viajes));

            // AUDITORÍA: Registrar la creación del viaje
            const emailActivoLog = localStorage.getItem('fletarg_usuario_activo') || 'Cliente';
            registrarAccionEnBitacora('VIAJE_CREADO', `Nuevo flete creado por ${datosViajeTemporal.precio} de ${datosViajeTemporal.origen} a ${datosViajeTemporal.destino}`, emailActivoLog);

            alert('¡Flete creado con éxito! Publicado para los proveedores.');
            modalConfirmacion.classList.add('oculto');
            
            // --- LIMPIEZA TOTAL Y PROFUNDA DEL FORMULARIO ---
            document.getElementById('origen').value = '';
            document.getElementById('destino').value = '';
            document.getElementById('detalle-carga').value = '';
            
            const inputTipoViajeSel = document.getElementById('tipo-viaje-seleccion');
            if (inputTipoViajeSel) inputTipoViajeSel.value = '';

            document.querySelectorAll('.btn-opcion-cuando').forEach(b => b.classList.remove('activo'));
            
            const contenedorFecha = document.getElementById('contenedor-fecha');
            if (contenedorFecha) contenedorFecha.style.display = 'none';

            const inputFechaProgramada = document.getElementById('fecha-programada');
            if (inputFechaProgramada) inputFechaProgramada.value = '';

            const textoFechaElegida = document.getElementById('texto-fecha-elegida');
            if (textoFechaElegida) {
                textoFechaElegida.style.display = 'none';
                textoFechaElegida.innerText = '';
            }

            const checkPeon = document.getElementById('peon');
            const inputCantPeones = document.getElementById('cantidad-peones');
            if (checkPeon) {
                checkPeon.checked = false;
                checkPeon.dispatchEvent(new Event('change'));
            }
            if (inputCantPeones) inputCantPeones.value = '';

            const checkEscalera = document.getElementById('escalera');
            const inputCantPisos = document.getElementById('cantidad-pisos');
            if (checkEscalera) {
                checkEscalera.checked = false;
                checkEscalera.dispatchEvent(new Event('change'));
            }
            if (inputCantPisos) inputCantPisos.value = '';

            const selectPago = document.getElementById('metodo-pago');
            if (selectPago) selectPago.value = 'efectivo';

            datosViajeTemporal = null;
        });
    }

    // ========================================
    // 8. RENDERIZAR VIAJES DEL PROVEEDOR (Con Filtros)
    // ==========================================
    window.filtroVehiculoActual = 'todos'; // Variable global para recordar el filtro activo

    window.renderizarViajesProveedor = function(filtro = 'todos') {
        const contenedorPendientes = document.getElementById('lista-viajes-pendientes');
        const contenedorAceptados = document.getElementById('lista-viajes-aceptados');
        const contenedorCompletados = document.getElementById('lista-viajes-completados');
        
        let viajes = JSON.parse(localStorage.getItem('fletarg_viajes')) || [];
        
        let pendientes = viajes.filter(v => v.estado === 'pendiente');
        const aceptados = viajes.filter(v => v.estado === 'aceptado');
        const completados = viajes.filter(v => v.estado === 'completado');

        // Aplicar filtro por vehículo en pendientes si corresponde
        if (filtro !== 'todos') {
            pendientes = pendientes.filter(v => v.vehiculo === filtro);
        }

        const btnPendientes = document.getElementById('btn-tab-pendientes');
        const btnAceptados = document.getElementById('btn-tab-aceptados');
        const btnCompletados = document.getElementById('btn-tab-completados');

        if (btnPendientes) btnPendientes.innerText = `Pendientes (${viajes.filter(v => v.estado === 'pendiente').length})`;
        if (btnAceptados) btnAceptados.innerText = `Aceptados (${aceptados.length})`;
        if (btnCompletados) btnCompletados.innerText = `Completados (${completados.length})`;

        if (contenedorPendientes) {
            contenedorPendientes.innerHTML = pendientes.length === 0 ? '<p style="color: #777; text-align: center; padding: 20px;">No hay viajes disponibles para este filtro.</p>' : '';
            pendientes.forEach(viaje => {
                contenedorPendientes.innerHTML += `
                    <div class="tarjeta-viaje" data-id="${viaje.id}">
                        <div class="viaje-precio">
                            <h4>${viaje.precio}</h4>
                            <span class="distancia">${viaje.vehiculo}</span>
                        </div>
                        <div class="viaje-ruta">
                            <p>📍 <strong>Origen:</strong> ${viaje.origen}</p>
                            <p>🏁 <strong>Destino:</strong> ${viaje.destino}</p>
                            <p>📅 <strong>Cuándo:</strong> ${viaje.detallesExtra?.tipoViaje || '⚡ Lo antes posible'}</p>
                        </div>
                        <div class="acciones-viaje" style="display:flex; gap:10px; margin-top:15px;">
                            <button class="btn-rechazar" onclick="gestionarViaje(${viaje.id}, 'rechazado')">Rechazar</button>
                            <button class="btn-aceptar" onclick="gestionarViaje(${viaje.id}, 'aceptado')">Aceptar</button>
                        </div>
                    </div>
                `;
            });
        }

        if (contenedorAceptados) {
            contenedorAceptados.innerHTML = aceptados.length === 0 ? '<p style="color: #777; text-align: center; padding: 20px;">No tenés viajes en curso.</p>' : '';
            aceptados.forEach(viaje => {
                contenedorAceptados.innerHTML += `
                    <div class="tarjeta-viaje" data-id="${viaje.id}">
                        <div class="viaje-precio">
                            <h4>${viaje.precio}</h4>
                            <span class="distancia" style="background-color: #e2f0d9; color: #385723;">Aceptado</span>
                        </div>
                        <div class="viaje-ruta">
                            <p>📍 <strong>Origen:</strong> ${viaje.origen}</p>
                            <p>🏁 <strong>Destino:</strong> ${viaje.destino}</p>
                        </div>
                        <button class="btn-principal" style="background-color: #28a745; margin-top:15px;" onclick="finalizarViajeConCalificacion(${viaje.id})">Finalizar viaje</button>
                    </div>
                `;
            });
        }

        if (contenedorCompletados) {
            contenedorCompletados.innerHTML = completados.length === 0 ? '<p style="color: #777; text-align: center; padding: 20px;">Sin historial todavía.</p>' : '';
            completados.forEach(viaje => {
                contenedorCompletados.innerHTML += `
                    <div class="tarjeta-viaje" style="opacity: 0.85;" data-id="${viaje.id}">
                        <div class="viaje-precio">
                            <h4>${viaje.precio}</h4>
                            <span class="distancia" style="background-color: #eee; color: #666;">Completado</span>
                        </div>
                        <div class="viaje-ruta">
                            <p>📍 <strong>Origen:</strong> ${viaje.origen}</p>
                            <p>🏁 <strong>Destino:</strong> ${viaje.destino}</p>
                        </div>
                    </div>
                `;
            });
        }
    };

    // Ejecutar al cargar la página si estamos en el panel de proveedor
    renderizarViajesProveedor();

    // ==========================================
    // 9. RENDERIZAR VIAJES DEL CLIENTE
    // ==========================================
    const contenedorClientePendientes = document.getElementById('lista-cliente-pendientes');
    const contenedorClienteEnCurso = document.getElementById('lista-cliente-en-curso');
    const contenedorClienteHistorial = document.getElementById('lista-cliente-historial');

    if (contenedorClientePendientes || contenedorClienteEnCurso || contenedorClienteHistorial) {
        let viajes = JSON.parse(localStorage.getItem('fletarg_viajes')) || [];
        const misPendientes = viajes.filter(v => v.estado === 'pendiente');
        const misEnCurso = viajes.filter(v => v.estado === 'aceptado');
        const misHistorial = viajes.filter(v => v.estado === 'completado');

        const btnClP = document.getElementById('btn-cliente-pendientes');
        const btnClEC = document.getElementById('btn-cliente-en-curso');
        const btnClH = document.getElementById('btn-cliente-historial');

        if (btnClP) btnClP.innerText = `Buscando (${misPendientes.length})`;
        if (btnClEC) btnClEC.innerText = `En Camino (${misEnCurso.length})`;
        if (btnClH) btnClH.innerText = `Historial (${misHistorial.length})`;

        if (contenedorClientePendientes) {
            contenedorClientePendientes.innerHTML = misPendientes.length === 0 ? '<p style="color: #777; text-align: center; padding: 20px;">No tenés fletes en búsqueda.</p>' : '';
            misPendientes.forEach(v => {
                contenedorClientePendientes.innerHTML += `
                    <div class="tarjeta-viaje">
                        <div class="viaje-precio"><h4>${v.precio}</h4><span class="distancia">Buscando</span></div>
                        <div class="viaje-ruta"><p>📍 ${v.origen}</p><p>🏁 ${v.destino}</p></div>
                    </div>
                `;
            });
        }

        if (contenedorClienteEnCurso) {
            contenedorClienteEnCurso.innerHTML = misEnCurso.length === 0 ? '<p style="color: #777; text-align: center; padding: 20px;">No tenés fletes en curso.</p>' : '';
            misEnCurso.forEach(v => {
                contenedorClienteEnCurso.innerHTML += `
                    <div class="tarjeta-viaje">
                        <div class="viaje-precio"><h4>${v.precio}</h4><span class="distancia" style="background:#e2f0d9; color:#385723;">En camino</span></div>
                        <div class="viaje-ruta"><p>📍 ${v.origen}</p><p>🏁 ${v.destino}</p></div>
                    </div>
                `;
            });
        }

        if (contenedorClienteHistorial) {
            contenedorClienteHistorial.innerHTML = misHistorial.length === 0 ? '<p style="color: #777; text-align: center; padding: 20px;">Sin historial.</p>' : '';
            misHistorial.forEach(v => {
                contenedorClienteHistorial.innerHTML += `
                    <div class="tarjeta-viaje" style="opacity: 0.85;">
                        <div class="viaje-precio"><h4>${v.precio}</h4><span class="distancia" style="background:#eee; color:#666;">Finalizado</span></div>
                        <div class="viaje-ruta"><p>📍 ${v.origen}</p><p>🏁 ${v.destino}</p></div>
                    </div>
                `;
            });
        }
    }

    // ==========================================
    // 10. RENDERIZAR DATOS EN PERFIL
    // ==========================================
    const perfilNombre = document.getElementById('perfil-nombre');
    if (perfilNombre) {
        if (!emailActivo) {
            window.location.href = 'index.html';
            return;
        }
        const datosUsuario = JSON.parse(localStorage.getItem(emailActivo));
        if (datosUsuario) {
            perfilNombre.innerText = `${datosUsuario.nombre} ${datosUsuario.apellido}`;
            document.getElementById('perfil-email').innerText = datosUsuario.email;
            document.getElementById('perfil-rol').innerText = datosUsuario.rol.toUpperCase();

            const navPerfil = document.getElementById('nav-perfil');
            if (navPerfil) {
                if (datosUsuario.rol === 'cliente') {
                    navPerfil.innerHTML = `
                        <a href="cliente.html" class="nav-item"><span class="icono">🏠</span><span>Inicio</span></a>
                        <a href="cliente-viajes.html" class="nav-item"><span class="icono">📦</span><span>Mis Viajes</span></a>
                        <a href="perfil.html" class="nav-item activo"><span class="icono">👤</span><span>Perfil</span></a>
                    `;
                } else {
                    navPerfil.innerHTML = `
                        <a href="proveedor-perfil.html" class="nav-item"><span class="icono">📊</span><span>Mis Viajes</span></a>
                        <a href="perfil.html" class="nav-item activo"><span class="icono">👤</span><span>Perfil</span></a>
                    `;
                }
            }
        }
    }

    // ==========================================
    // 11. ESTADÍSTICAS DEL PROVEEDOR
    // ==========================================
    const statGanancias = document.getElementById('stat-ganancias');
    if (statGanancias) {
        let viajes = JSON.parse(localStorage.getItem('fletarg_viajes')) || [];
        const completados = viajes.filter(v => v.estado === 'completado');

        let totalGanancias = 0;
        let sumaCalificaciones = 0;

        completados.forEach(v => {
            if (v.precio) {
                totalGanancias += parseInt(v.precio.replace('$', '').replace(/\./g, '').trim()) || 0;
            }
            if (v.calificacionProveedor) {
                sumaCalificaciones += v.calificacionProveedor;
            }
        });

        document.getElementById('stat-ganancias').innerText = `$ ${totalGanancias.toLocaleString('es-AR')}`;
        document.getElementById('stat-viajes').innerText = completados.length;
        
        const promedio = completados.length > 0 ? (sumaCalificaciones / completados.length).toFixed(1) : '-';
        document.getElementById('stat-calificacion').innerText = `⭐ ${promedio}`;
    }

    // ==========================================
    // 12. MODO OSCURO (CARGA INICIAL)
    // ==========================================
    if (localStorage.getItem('fletarg_dark_mode') === 'enabled') {
        document.body.classList.add('dark-mode');
    }

}); // FIN DE DOMContentLoaded


// ==========================================
// FUNCIONES GLOBALES (FUERA DE DOMContentLoaded)

// ==========================================

// SISTEMA CENTRALIZADO DE AUDITORÍA Y LOGS
function registrarAccionEnBitacora(tipoAccion, descripcion, usuarioInvolucrado = 'Anónimo') {
    const bitacora = JSON.parse(localStorage.getItem('fletarg_auditoria')) || [];
    
    const nuevoRegistro = {
        id: Date.now(),
        fechaHora: new Date().toLocaleString('es-AR', { 
            day: '2-digit', month: '2-digit', year: 'numeric', 
            hour: '2-digit', minute: '2-digit', second: '2-digit' 
        }),
        tipo: tipoAccion, 
        descripcion: descripcion,
        usuario: usuarioInvolucrado
    };

    bitacora.unshift(nuevoRegistro);
    localStorage.setItem('fletarg_auditoria', JSON.stringify(bitacora));
}

function mostrarFormulario(rol) {
    document.getElementById('seleccion-perfil').style.display = 'none';
    document.getElementById('titulo-registro').innerText = rol === 'cliente' ? 'Registro de Cliente' : 'Registro de Proveedor';
    document.getElementById('form-registro').style.display = 'block';
    document.getElementById('rol-elegido').value = rol;

    const camposProveedor = document.getElementById('campos-proveedor');
    if (camposProveedor) {
        camposProveedor.style.display = rol === 'proveedor' ? 'block' : 'none';
    }
}

function volverSeleccion() {
    document.getElementById('form-registro').style.display = 'none';
    document.getElementById('seleccion-perfil').style.display = 'flex';
    document.getElementById('titulo-registro').innerText = 'Elegí tu tipo de cuenta';
}

function cambiarPestana(nombrePestana) {
    ['pendientes', 'aceptados', 'completados'].forEach(p => {
        const sec = document.getElementById(`seccion-${p}`);
        if (sec) sec.style.display = p === nombrePestana ? 'block' : 'none';
    });
    document.querySelectorAll('.pestana-btn').forEach(btn => btn.classList.remove('activa'));
    if (event && event.target) event.target.classList.add('activa');
}

function cambiarPestanaCliente(nombrePestana) {
    ['pendientes', 'en-curso', 'historial'].forEach(p => {
        const sec = document.getElementById(`seccion-cliente-${p}`);
        if (sec) sec.style.display = p === nombrePestana ? 'block' : 'none';
    });
    document.querySelectorAll('.pestana-btn').forEach(btn => btn.classList.remove('activa'));
    if (event && event.target) event.target.classList.add('activa');
}

function gestionarViaje(idViaje, nuevoEstado) {
    let viajes = JSON.parse(localStorage.getItem('fletarg_viajes')) || [];
    viajes = viajes.map(v => {
        if (v.id === idViaje) v.estado = nuevoEstado;
        return v;
    });
    localStorage.setItem('fletarg_viajes', JSON.stringify(viajes));

    // AUDITORÍA: Registrar cambio de estado del viaje
    const proveedorActivo = localStorage.getItem('fletarg_usuario_activo') || 'Proveedor';
    registrarAccionEnBitacora('ESTADO_VIAJE', `El viaje ID ${idViaje} cambió a estado: ${nuevoEstado}`, proveedorActivo);

    alert(`El viaje fue ${nuevoEstado}`);
    location.reload();
}

function finalizarViajeConCalificacion(idViaje) {
    let calificacionProv = prompt('Calificá la experiencia con el cliente (1 a 5):', '5');
    if (calificacionProv === null) return; 

    let estrellas = parseInt(calificacionProv);
    if (isNaN(estrellas) || estrellas < 1 || estrellas > 5) {
        alert('Ingresá un número válido entre 1 y 5.');
        return;
    }

    let viajes = JSON.parse(localStorage.getItem('fletarg_viajes')) || [];
    viajes = viajes.map(v => {
        if (v.id === idViaje) {
            v.estado = 'completado';
            v.calificacionProveedor = estrellas; 
        }
        return v;
    });

    localStorage.setItem('fletarg_viajes', JSON.stringify(viajes));

    // AUDITORÍA: Registrar finalización y calificación
    const provFinalizador = localStorage.getItem('fletarg_usuario_activo') || 'Proveedor';
    registrarAccionEnBitacora('VIAJE_FINALIZADO', `Viaje ID ${idViaje} finalizado. Calificación otorgada: ${estrellas} estrellas`, provFinalizador);

    alert('¡Viaje finalizado y archivado con éxito!');
    location.reload();
}

function cerrarSesion() {
    localStorage.removeItem('fletarg_usuario_activo');
    window.location.href = 'index.html';
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('fletarg_dark_mode', 'enabled');
    } else {
        localStorage.setItem('fletarg_dark_mode', 'disabled');
    }
}

function togglePrecioPeon(select) {
    const contenedor = document.getElementById('contenedor-precio-peon');
    const inputPrecio = document.getElementById('precio-peon');
    
    if (select.value === 'si') {
        contenedor.style.display = 'block';
    } else {
        contenedor.style.display = 'none';
        if (inputPrecio) inputPrecio.value = '';
    }
}

// Función global para manejar los clics en los botones de filtro del proveedor
function filtrarViajes(tipoVehiculo, botonElemento) {
    // Cambiar clases activas en los botones de filtro
    const botones = document.querySelectorAll('.btn-filtro');
    botones.forEach(b => b.classList.remove('activo'));
    botonElemento.classList.add('activo');

    // Volver a renderizar la lista aplicando el filtro
    if (typeof renderizarViajesProveedor === 'function') {
        renderizarViajesProveedor(tipoVehiculo);
    }
}

// ==========================================
// SISTEMA CENTRALIZADO DE REGISTRO / AUDITORÍA
// ==========================================
function registrarAccionEnBitacora(tipoAccion, descripcion, usuarioInvolucrado = 'Anónimo') {
    const bitacora = JSON.parse(localStorage.getItem('fletarg_auditoria')) || [];
    
    const nuevoRegistro = {
        id: Date.now(),
        fechaHora: new Date().toLocaleString('es-AR', { 
            day: '2-digit', month: '2-digit', year: 'numeric', 
            hour: '2-digit', minute: '2-digit', second: '2-digit' 
        }),
        tipo: tipoAccion, // Ej: 'REGISTRO', 'LOGIN', 'RECUPERO', 'VIAJE', 'ESTADO_VIAJE'
        descripcion: descripcion,
        usuario: usuarioInvolucrado
    };

    bitacora.unshift(nuevoRegistro); // Lo ponemos al principio para ver lo más nuevo primero
    localStorage.setItem('fletarg_auditoria', JSON.stringify(bitacora));
}

// ==========================================
// FLUJO DE RECUPERACIÓN DE CONTRASEÑA (Página dedicada)
// ==========================================

let emailEnProcesoRecupero = null;
let codigoGeneradoSimulado = null;

function enviarCodigoRecuperoPagina(e) {
    e.preventDefault();
    const emailInput = document.getElementById('email-recupero');
    const email = emailInput ? emailInput.value.trim() : '';

    if (!email) {
        alert('⚠️ Por favor, ingresá tu correo electrónico.');
        return;
    }

    // Verificar si el usuario existe en el localStorage
    const datosUsuario = localStorage.getItem(email);
    if (!datosUsuario) {
        alert('⚠️ El correo ingresado no se encuentra registrado en FletArg.');
        return;
    }

    // Generar código aleatorio de 6 dígitos
    codigoGeneradoSimulado = Math.floor(100000 + Math.random() * 900000).toString();
    emailEnProcesoRecupero = email;

    // Simulación de envío de correo
    alert(`📧 [SIMULACIÓN DE EMAIL] Correo enviado a ${email}.\n\nTu código de recuperación es: ${codigoGeneradoSimulado}`);

    // Alternar vistas de los pasos
    const pasoCorreo = document.getElementById('paso-correo');
    const pasoNuevaPass = document.getElementById('paso-nueva-pass');

    if (pasoCorreo) pasoCorreo.style.display = 'none';
    if (pasoNuevaPass) pasoNuevaPass.style.display = 'block';

    // AUDITORÍA: Registrar evento
    if (typeof registrarAccionEnBitacora === 'function') {
        registrarAccionEnBitacora('RECUPERO_SOLICITUD', `Solicitud de código de recuperación`, email);
    }
}

function cambiarContrasenaPagina(e) {
    e.preventDefault();
    const codigoInput = document.getElementById('codigo-ingresado');
    const nuevaPassInput = document.getElementById('nueva-contrasena');

    const codigoIngresado = codigoInput ? codigoInput.value.trim() : '';
    const nuevaPass = nuevaPassInput ? nuevaPassInput.value.trim() : '';

    if (codigoIngresado !== codigoGeneradoSimulado) {
        alert('⚠️ El código ingresado es incorrecto.');
        return;
    }

    if (nuevaPass.length < 4) {
        alert('⚠️ La contraseña debe tener al menos 4 caracteres.');
        return;
    }

    // Actualizar datos en el localStorage
    const datosUsuario = JSON.parse(localStorage.getItem(emailEnProcesoRecupero));
    if (datosUsuario) {
        datosUsuario.password = nuevaPass;
        localStorage.setItem(emailEnProcesoRecupero, JSON.stringify(datosUsuario));

        // AUDITORÍA: Registrar éxito
        if (typeof registrarAccionEnBitacora === 'function') {
            registrarAccionEnBitacora('RECUPERO_EXITOSO', `Contraseña restablecida exitosamente`, emailEnProcesoRecupero);
        }

        alert('🎉 ¡Contraseña actualizada con éxito! Ya podés iniciar sesión.');
        window.location.href = 'index.html';
    } else {
        alert('⚠️ Ocurrió un error al actualizar la cuenta.');
    }
}