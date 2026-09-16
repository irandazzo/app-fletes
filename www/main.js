document.addEventListener('DOMContentLoaded', () => {
// ==========================================
    // 0. PROTECCIÓN DE RUTAS SEGÚN EL ROL
    // ==========================================
    const path = window.location.pathname;
    const emailActivo = localStorage.getItem('fletarg_usuario_activo');

    // Si está en páginas internas y no hay sesión activa, al login
    if ((path.includes('cliente') || path.includes('proveedor') || path.includes('perfil')) && !emailActivo) {
        window.location.href = 'index.html';
        return;
    }

    if (emailActivo) {
        const usuarioActivo = JSON.parse(localStorage.getItem(emailActivo));
        if (usuarioActivo) {
            // Si es cliente e intenta entrar a vistas de proveedor
            if (usuarioActivo.rol === 'cliente' && path.includes('proveedor')) {
                window.location.href = 'cliente.html';
                return;
            }
            // Si es proveedor e intenta entrar a vistas de cliente
            if (usuarioActivo.rol === 'proveedor' && (path.includes('cliente.html') || path.includes('cliente-viajes.html'))) {
                window.location.href = 'proveedor-perfil.html';
                return;
            }
        }
    }
    
    // 1. LÓGICA DE SELECCIÓN DE VEHÍCULOS (Cliente)
    const tarjetasVehiculo = document.querySelectorAll('.opcion-card');
    if (tarjetasVehiculo.length > 0) {
        tarjetasVehiculo.forEach(tarjeta => {
            tarjeta.addEventListener('click', () => {
                tarjetasVehiculo.forEach(t => t.classList.remove('activa'));
                tarjeta.classList.add('activa');
            });
        });
    }

    // 2. LÓGICA DE NEGOCIACIÓN DE PRECIO (Cliente)
    const checkNegociar = document.getElementById('check-negociar');
    const contenedorContraoferta = document.getElementById('contenedor-contraoferta');
    if (checkNegociar && contenedorContraoferta) {
        checkNegociar.addEventListener('change', () => {
            if (checkNegociar.checked) {
                contenedorContraoferta.style.display = 'block';
            } else {
                contenedorContraoferta.style.display = 'none';
                document.getElementById('monto-oferta').value = '';
            }
        });
    }

    // 3. LÓGICA DE REGISTRO (Guarda en localStorage según el rol elegido)
    const formRegistro = document.getElementById('form-registro');
    if (formRegistro) {
        formRegistro.addEventListener('submit', (evento) => {
            evento.preventDefault();

            const nombre = document.getElementById('nombre').value;
            const apellido = document.getElementById('apellido').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('contrasena-reg').value;
            const rol = document.getElementById('rol-elegido').value;

            const usuarioNuevo = {
                nombre,
                apellido,
                email,
                password,
                rol
            };

            localStorage.setItem(email, JSON.stringify(usuarioNuevo));

            alert('¡Cuenta creada con éxito! Ya podés iniciar sesión.');
            window.location.href = 'index.html';
        });
    }

    // 4. LÓGICA DE LOGIN (Busca la cuenta, guarda la sesión y redirige)
    const formLogin = document.getElementById('form-login');
    if (formLogin) {
        formLogin.addEventListener('submit', (evento) => {
            evento.preventDefault();
            
            const emailIngresado = document.getElementById('usuario').value.trim();
            const passwordIngresada = document.getElementById('contrasena').value.trim();

            const datosUsuarioGuardado = localStorage.getItem(emailIngresado);

            if (!datosUsuarioGuardado) {
                alert('⚠️ Error: No existe una cuenta registrada con este correo electrónico.');
                return;
            }

            const usuario = JSON.parse(datosUsuarioGuardado);

            if (usuario.password !== passwordIngresada) {
                alert('⚠️ Error: Contraseña incorrecta.');
                return;
            }

            // Guardamos el usuario activo de la sesión actual
            localStorage.setItem('fletarg_usuario_activo', emailIngresado);

            // Redirección automática según el rol
            if (usuario.rol === 'cliente') {
                window.location.href = 'cliente.html';
            } else if (usuario.rol === 'proveedor') {
                window.location.href = 'proveedor-perfil.html';
            }
        });
    }

    // 7. LÓGICA DE CREACIÓN DE VIAJE (Cliente)
    const btnCotizar = document.querySelector('.panel-pedido .btn-principal');
    if (btnCotizar && document.body.classList.contains('body-cliente')) {
        btnCotizar.addEventListener('click', () => {
            const origenInput = document.getElementById('origen');
            const destinoInput = document.getElementById('destino');
            const vehiculoActivo = document.querySelector('.opcion-card.activa .nombre-vehiculo');

            const origen = origenInput ? origenInput.value.trim() : '';
            const destino = destinoInput ? destinoInput.value.trim() : '';
            const tipoVehiculo = vehiculoActivo ? vehiculoActivo.innerText : 'Moto';

            if (!origen || !destino) {
                alert('⚠️ Por favor, completá la dirección de origen y de destino.');
                return;
            }

            const nuevoViaje = {
                id: Date.now(),
                origen: origen,
                destino: destino,
                vehiculo: tipoVehiculo,
                precio: tipoVehiculo === 'Camión' ? '$ 45.000' : (tipoVehiculo === 'Pickup' ? '$ 25.000' : '$ 12.000'),
                estado: 'pendiente'
            };

            let viajes = JSON.parse(localStorage.getItem('fletarg_viajes')) || [];
            viajes.push(nuevoViaje);
            
            localStorage.setItem('fletarg_viajes', JSON.stringify(viajes));

            alert('¡Flete creado con éxito! El viaje fue publicado para los proveedores.');
            
            origenInput.value = '';
            destinoInput.value = '';
        });
    }

    // 8., 9. & 10. RENDERIZAR VIAJES Y CONTADORES EN EL PANEL DEL PROVEEDOR
    const contenedorPendientes = document.getElementById('lista-viajes-pendientes');
    const contenedorAceptados = document.getElementById('lista-viajes-aceptados');
    const contenedorCompletados = document.getElementById('lista-viajes-completados');
    
    if (contenedorPendientes || contenedorAceptados || contenedorCompletados) {
        let viajes = JSON.parse(localStorage.getItem('fletarg_viajes')) || [];
        
        const pendientes = viajes.filter(v => v.estado === 'pendiente');
        const aceptados = viajes.filter(v => v.estado === 'aceptado');
        const completados = viajes.filter(v => v.estado === 'completado');

        const btnPendientes = document.getElementById('btn-tab-pendientes');
        const btnAceptados = document.getElementById('btn-tab-aceptados');
        const btnCompletados = document.getElementById('btn-tab-completados');

        if (btnPendientes) btnPendientes.innerText = `Pendientes (${pendientes.length})`;
        if (btnAceptados) btnAceptados.innerText = `Aceptados (${aceptados.length})`;
        if (btnCompletados) btnCompletados.innerText = `Completados (${completados.length})`;

        // Renderizar Pendientes
        if (contenedorPendientes) {
            if (pendientes.length === 0) {
                contenedorPendientes.innerHTML = '<p style="color: #777; text-align: center; padding: 20px;">No hay viajes disponibles en este momento.</p>';
            } else {
                contenedorPendientes.innerHTML = '';
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
                            </div>
                            <p class="viaje-detalle">📦 Vehículo solicitado: ${viaje.vehiculo}</p>
                            <div class="acciones-viaje">
                                <button class="btn-rechazar" onclick="gestionarViaje(${viaje.id}, 'rechazado')">Rechazar</button>
                                <button class="btn-aceptar" onclick="gestionarViaje(${viaje.id}, 'aceptado')">Aceptar</button>
                            </div>
                        </div>
                    `;
                });
            }
        }

        // Renderizar Aceptados
        if (contenedorAceptados) {
            if (aceptados.length === 0) {
                contenedorAceptados.innerHTML = '<p style="color: #777; text-align: center; padding: 20px;">No tenés viajes aceptados en curso.</p>';
            } else {
                contenedorAceptados.innerHTML = '';
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
                            <p class="viaje-detalle">📦 Vehículo: ${viaje.vehiculo}</p>
                            <button class="btn-principal" style="background-color: #28a745;" onclick="finalizarViajeConCalificacion(${viaje.id})">Finalizar viaje</button>
                        </div>
                    `;
                });
            }
        }

        // Renderizar Completados
        if (contenedorCompletados) {
            if (completados.length === 0) {
                contenedorCompletados.innerHTML = '<p style="color: #777; text-align: center; padding: 20px;">Aún no tenés viajes completados en tu historial.</p>';
            } else {
                contenedorCompletados.innerHTML = '';
                completados.forEach(viaje => {
                    const califCliente = viaje.calificacionCliente ? `⭐ Cliente: ${viaje.calificacionCliente}/5` : '⭐ Sin calificar por cliente';
                    const califProveedor = viaje.calificacionProveedor ? `⭐ Proveedor: ${viaje.calificacionProveedor}/5` : '⭐ Sin calificar por proveedor';

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
                            <p class="viaje-detalle">📦 Vehículo: ${viaje.vehiculo}</p>
                            <div style="font-size: 13px; color: #555; background: #f1f3f5; padding: 8px; border-radius: 6px; margin-top: 10px;">
                                <p>${califCliente}</p>
                                <p>${califProveedor}</p>
                            </div>
                        </div>
                    `;
                });
            }
        }
    }

    // 11. RENDERIZAR PANEL DE VIAJES DEL CLIENTE
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
            if (misPendientes.length === 0) {
                contenedorClientePendientes.innerHTML = '<p style="color: #777; text-align: center; padding: 20px;">No tenés fletes en búsqueda activa.</p>';
            } else {
                contenedorClientePendientes.innerHTML = '';
                misPendientes.forEach(viaje => {
                    contenedorClientePendientes.innerHTML += `
                        <div class="tarjeta-viaje">
                            <div class="viaje-precio">
                                <h4>${viaje.precio}</h4>
                                <span class="distancia">Buscando proveedor</span>
                            </div>
                            <div class="viaje-ruta">
                                <p>📍 <strong>Origen:</strong> ${viaje.origen}</p>
                                <p>🏁 <strong>Destino:</strong> ${viaje.destino}</p>
                            </div>
                            <p class="viaje-detalle">📦 Vehículo: ${viaje.vehiculo}</p>
                        </div>
                    `;
                });
            }
        }

        if (contenedorClienteEnCurso) {
            if (misEnCurso.length === 0) {
                contenedorClienteEnCurso.innerHTML = '<p style="color: #777; text-align: center; padding: 20px;">No tenés fletes en curso en este momento.</p>';
            } else {
                contenedorClienteEnCurso.innerHTML = '';
                misEnCurso.forEach(viaje => {
                    contenedorClienteEnCurso.innerHTML += `
                        <div class="tarjeta-viaje">
                            <div class="viaje-precio">
                                <h4>${viaje.precio}</h4>
                                <span class="distancia" style="background-color: #e2f0d9; color: #385723;">En camino</span>
                            </div>
                            <div class="viaje-ruta">
                                <p>📍 <strong>Origen:</strong> ${viaje.origen}</p>
                                <p>🏁 <strong>Destino:</strong> ${viaje.destino}</p>
                            </div>
                            <p class="viaje-detalle">📦 Vehículo: ${viaje.vehiculo}</p>
                        </div>
                    `;
                });
            }
        }

        if (contenedorClienteHistorial) {
            if (misHistorial.length === 0) {
                contenedorClienteHistorial.innerHTML = '<p style="color: #777; text-align: center; padding: 20px;">Aún no tenés fletes finalizados en tu historial.</p>';
            } else {
                contenedorClienteHistorial.innerHTML = '';
                misHistorial.forEach(viaje => {
                    const califProv = viaje.calificacionProveedor ? `⭐ Tu calificación al proveedor: ${viaje.calificacionProveedor}/5` : '⭐ Sin calificar';
                    
                    contenedorClienteHistorial.innerHTML += `
                        <div class="tarjeta-viaje" style="opacity: 0.85;">
                            <div class="viaje-precio">
                                <h4>${viaje.precio}</h4>
                                <span class="distancia" style="background-color: #eee; color: #666;">Finalizado</span>
                            </div>
                            <div class="viaje-ruta">
                                <p>📍 <strong>Origen:</strong> ${viaje.origen}</p>
                                <p>🏁 <strong>Destino:</strong> ${viaje.destino}</p>
                            </div>
                            <p class="viaje-detalle">📦 Vehículo: ${viaje.vehiculo}</p>
                            <div style="font-size: 13px; color: #555; background: #f1f3f5; padding: 8px; border-radius: 6px; margin-top: 10px;">
                                <p>${califProv}</p>
                            </div>
                        </div>
                    `;
                });
            }
        }
    }

    // 12. RENDERIZAR DATOS EN LA PANTALLA DE PERFIL
    const perfilNombre = document.getElementById('perfil-nombre');
    if (perfilNombre) {
        const emailActivo = localStorage.getItem('fletarg_usuario_activo');
        
        if (!emailActivo) {
            alert('⚠️ No hay una sesión activa. Por favor, iniciá sesión.');
            window.location.href = 'index.html';
            return;
        }

        const datosUsuarioJSON = localStorage.getItem(emailActivo);
        
        if (!datosUsuarioJSON) {
            localStorage.removeItem('fletarg_usuario_activo');
            alert('⚠️ Error: Los datos de este usuario ya no existen. Volvé a iniciar sesión.');
            window.location.href = 'index.html';
            return;
        }

        const datosUsuario = JSON.parse(datosUsuarioJSON);

        perfilNombre.innerText = `${datosUsuario.nombre || 'Usuario'} ${datosUsuario.apellido || ''}`;
        document.getElementById('perfil-email').innerText = datosUsuario.email || emailActivo;
        
        const spanRol = document.getElementById('perfil-rol');
        const rolUsuario = datosUsuario.rol || 'cliente';
        spanRol.innerText = rolUsuario.toUpperCase();

        const navPerfil = document.getElementById('nav-perfil');
        if (navPerfil) {
            if (rolUsuario === 'cliente') {
                navPerfil.innerHTML = `
                    <a href="cliente.html" style="text-decoration: none;" class="nav-item">
                        <span class="icono">🏠</span>
                        <span>Inicio</span>
                    </a>
                    <a href="cliente-viajes.html" style="text-decoration: none;" class="nav-item">
                        <span class="icono">📦</span>
                        <span>Mis Viajes</span>
                    </a>
                    <a href="perfil.html" style="text-decoration: none;" class="nav-item activo">
                        <span class="icono">👤</span>
                        <span>Perfil</span>
                    </a>
                `;
            } else {
                navPerfil.innerHTML = `
                    <a href="proveedor-perfil.html" style="text-decoration: none;" class="nav-item">
                        <span class="icono">📊</span>
                        <span>Mis Viajes</span>
                    </a>
                    <a href="perfil.html" style="text-decoration: none;" class="nav-item activo">
                        <span class="icono">👤</span>
                        <span>Perfil</span>
                    </a>
                `;
            }
        }
    }

}); // FIN DE DOMContentLoaded


// ==========================================
// FUNCIONES GLOBALES (FUERA DE DOMContentLoaded)
// ==========================================

function mostrarFormulario(rol) {
    document.getElementById('seleccion-perfil').style.display = 'none';
    document.getElementById('titulo-registro').innerText = rol === 'cliente' ? 'Registro de Cliente' : 'Registro de Proveedor';
    document.getElementById('form-registro').style.display = 'block';
    document.getElementById('rol-elegido').value = rol;

    const camposProveedor = document.getElementById('campos-proveedor');
    if (rol === 'proveedor') {
        camposProveedor.style.display = 'block';
    } else {
        camposProveedor.style.display = 'none';
    }
}

function volverSeleccion() {
    document.getElementById('form-registro').style.display = 'none';
    document.getElementById('seleccion-perfil').style.display = 'flex';
    document.getElementById('titulo-registro').innerText = 'Elegí tu tipo de cuenta';
}

function cambiarPestana(nombrePestana) {
    const secPendientes = document.getElementById('seccion-pendientes');
    const secAceptados = document.getElementById('seccion-aceptados');
    const secCompletados = document.getElementById('seccion-completados');

    if (secPendientes && secAceptados && secCompletados) {
        secPendientes.style.display = 'none';
        secAceptados.style.display = 'none';
        secCompletados.style.display = 'none';
    }

    const botonesPestana = document.querySelectorAll('.pestana-btn');
    botonesPestana.forEach(btn => btn.classList.remove('activa'));

    if (nombrePestana === 'pendientes' && secPendientes) {
        secPendientes.style.display = 'block';
    } else if (nombrePestana === 'aceptados' && secAceptados) {
        secAceptados.style.display = 'block';
    } else if (nombrePestana === 'completados' && secCompletados) {
        secCompletados.style.display = 'block';
    }

    if (event && event.target) {
        event.target.classList.add('activa');
    }
}

function cambiarPestanaCliente(nombrePestana) {
    const secPendientes = document.getElementById('seccion-cliente-pendientes');
    const secEnCurso = document.getElementById('seccion-cliente-en-curso');
    const secHistorial = document.getElementById('seccion-cliente-historial');

    if (secPendientes && secEnCurso && secHistorial) {
        secPendientes.style.display = 'none';
        secEnCurso.style.display = 'none';
        secHistorial.style.display = 'none';
    }

    const botonesPestana = document.querySelectorAll('.pestana-btn');
    botonesPestana.forEach(btn => btn.classList.remove('activa'));

    if (nombrePestana === 'pendientes' && secPendientes) {
        secPendientes.style.display = 'block';
    } else if (nombrePestana === 'en-curso' && secEnCurso) {
        secEnCurso.style.display = 'block';
    } else if (nombrePestana === 'historial' && secHistorial) {
        secHistorial.style.display = 'block';
    }

    if (event && event.target) {
        event.target.classList.add('activa');
    }
}

function gestionarViaje(idViaje, nuevoEstado) {
    let viajes = JSON.parse(localStorage.getItem('fletarg_viajes')) || [];
    
    viajes = viajes.map(v => {
        if (v.id === idViaje) {
            v.estado = nuevoEstado;
        }
        return v;
    });

    localStorage.setItem('fletarg_viajes', JSON.stringify(viajes));
    
    let mensaje = 'actualizado';
    if (nuevoEstado === 'aceptado') mensaje = 'aceptado con éxito. Pasó a la solapa Aceptados.';
    if (nuevoEstado === 'rechazado') mensaje = 'rechazado.';
    
    alert(`El viaje fue ${mensaje}`);
    location.reload();
}

function finalizarViajeConCalificacion(idViaje) {
    let calificacionProv = prompt('¡Viaje finalizado! Calificá la experiencia con el cliente (de 1 a 5 estrellas):', '5');
    
    if (calificacionProv === null) return; 

    let estrellas = parseInt(calificacionProv);
    if (isNaN(estrellas) || estrellas < 1 || estrellas > 5) {
        alert('Por favor, ingresá un número válido entre 1 y 5.');
        return;
    }

    let viajes = JSON.parse(localStorage.getItem('fletarg_viajes')) || [];
    
    viajes = viajes.map(v => {
        if (v.id === idViaje) {
            v.estado = 'completado';
            v.calificacionProveedor = estrellas; 
            v.calificacionCliente = Math.floor(Math.random() * 2) + 4; 
        }
        return v;
    });

    localStorage.setItem('fletarg_viajes', JSON.stringify(viajes));
    alert('¡Viaje archivado en el historial con éxito y calificaciones registradas!');
    location.reload();
}

function cerrarSesion() {
    localStorage.removeItem('fletarg_usuario_activo');
    window.location.href = 'index.html';
}

// 13. CÁLCULO Y RENDERIZADO DE ESTADÍSTICAS DEL PROVEEDOR
    const statGanancias = document.getElementById('stat-ganancias');
    if (statGanancias) {
        let viajes = JSON.parse(localStorage.getItem('fletarg_viajes')) || [];
        const completados = viajes.filter(v => v.estado === 'completado');

        let totalGanancias = 0;
        let sumaCalificaciones = 0;
        let cantidadCalificaciones = 0;

        completados.forEach(v => {
            // Limpiamos el string del precio para convertirlo en número matemático
            if (v.precio) {
                let precioNumerico = parseInt(v.precio.replace('$', '').replace(/\./g, '').trim()) || 0;
                totalGanancias += precioNumerico;
            }
            // Acumulamos las calificaciones que le dio el cliente al proveedor
            if (v.calificacionCliente) {
                sumaCalificaciones += v.calificacionCliente;
                cantidadCalificaciones++;
            }
        });

        // Actualizamos los valores en la tarjeta con formato de miles
        document.getElementById('stat-ganancias').innerText = `$ ${totalGanancias.toLocaleString('es-AR')}`;
        document.getElementById('stat-viajes').innerText = completados.length;

        if (cantidadCalificaciones > 0) {
            let promedio = (sumaCalificaciones / cantidadCalificaciones).toFixed(1);
            document.getElementById('stat-calificacion').innerText = `⭐ ${promedio}`;
        } else {
            document.getElementById('stat-calificacion').innerText = `⭐ -`;
        }
    }

    // 14. APLICAR MODO OSCURO GUARDADO AL CARGAR
    if (localStorage.getItem('fletarg_dark_mode') === 'enabled') {
        document.body.classList.add('dark-mode');
    }

    // Función global para alternar el Modo Oscuro
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('fletarg_dark_mode', 'enabled');
    } else {
        localStorage.setItem('fletarg_dark_mode', 'disabled');
    }
}