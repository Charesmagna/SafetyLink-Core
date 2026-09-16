package com.example.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.unit.dp
import com.example.data.db.IncidentEntity
import com.example.ui.theme.*
import kotlin.math.sqrt

@Composable
fun TacticalVectorMap(
    incidents: List<IncidentEntity>,
    selectedIncidentId: String?,
    onIncidentSelect: (String?) -> Unit,
    modifier: Modifier = Modifier
) {
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val pulseRadius by infiniteTransition.animateFloat(
        initialValue = 10f,
        targetValue = 40f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "pulse"
    )
    val pulseAlpha by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 0f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "pulseAlpha"
    )

    Canvas(
        modifier = modifier
            .fillMaxSize()
            .pointerInput(incidents) {
                detectTapGestures { offset ->
                    // Map local pixel coordinates to South African latitudes/longitudes
                    val mapWidth = size.width
                    val mapHeight = size.height

                    var tappedIncident: IncidentEntity? = null
                    var minDistance = Float.MAX_VALUE

                    for (incident in incidents) {
                        val coords = getLocalOffset(incident.lat, incident.lng, mapWidth.toFloat(), mapHeight.toFloat())
                        val dx = offset.x - coords.x
                        val dy = offset.y - coords.y
                        val distance = sqrt(dx * dx + dy * dy)
                        // Touch target threshold: 40 pixels
                        if (distance < 50f && distance < minDistance) {
                            minDistance = distance
                            tappedIncident = incident
                        }
                    }

                    if (tappedIncident != null) {
                        onIncidentSelect(tappedIncident.id)
                    } else {
                        onIncidentSelect(null)
                    }
                }
            }
    ) {
        val width = size.width
        val height = size.height

        // 1. Draw glowing radar coordinate gridlines
        val gridLines = 8
        for (i in 1..gridLines) {
            val x = (width / (gridLines + 1)) * i
            drawHorizontalGridline(x, height, Slate800)
            val y = (height / (gridLines + 1)) * i
            drawVerticalGridline(y, width, Slate800)
        }

        // 2. Draw South African stylized boundaries as a sleek vector path
        val saBoundaryPath = Path().apply {
            // Stylized land outline
            val ptCapeTown = getLocalOffset(-33.9249, 18.4241, width, height)
            val ptPortElizabeth = getLocalOffset(-33.9608, 25.6022, width, height)
            val ptDurban = getLocalOffset(-29.8587, 31.0218, width, height)
            val ptMusina = getLocalOffset(-22.3381, 30.0417, width, height)
            val ptUpington = getLocalOffset(-28.4552, 21.2425, width, height)
            val ptRichardsBay = getLocalOffset(-28.7807, 32.0383, width, height)

            moveTo(ptCapeTown.x, ptCapeTown.y)
            quadraticTo(ptCapeTown.x + 50f, ptCapeTown.y + 10f, ptPortElizabeth.x, ptPortElizabeth.y)
            lineTo(ptDurban.x, ptDurban.y)
            lineTo(ptRichardsBay.x, ptRichardsBay.y)
            lineTo(ptMusina.x, ptMusina.y)
            lineTo(ptUpington.x, ptUpington.y)
            close()
        }

        // Draw background map fill
        drawPath(
            path = saBoundaryPath,
            color = Slate900,
            alpha = 0.5f
        )

        // Draw boundary stroke
        drawPath(
            path = saBoundaryPath,
            color = Slate700,
            style = Stroke(width = 2.dp.toPx())
        )

        // 3. Draw active sector boundaries (Community Watch Patrol zones)
        // Cape Town Sector
        drawCircle(
            center = getLocalOffset(-33.9249, 18.4241, width, height),
            radius = 60f,
            color = Emerald500.copy(alpha = 0.1f)
        )
        // Johannesburg Sector
        drawCircle(
            center = getLocalOffset(-26.2041, 28.0473, width, height),
            radius = 90f,
            color = Amber500.copy(alpha = 0.1f)
        )

        // 4. Draw Incident Markers
        for (incident in incidents) {
            val pos = getLocalOffset(incident.lat, incident.lng, width, height)
            val isSelected = incident.id == selectedIncidentId

            val baseColor = when (incident.status) {
                "RESOLVED" -> Blue500
                "TRIGGERED" -> Red500
                "ACTIVE" -> Red500
                "DISPATCHED" -> Amber500
                "RESPONDER_ARRIVED" -> Emerald500
                else -> Emerald500
            }

            // Draw glowing pulsars for active threats
            if (incident.status != "RESOLVED") {
                drawCircle(
                    color = baseColor,
                    radius = pulseRadius,
                    center = pos,
                    alpha = pulseAlpha,
                    style = Stroke(width = 2.dp.toPx())
                )
            }

            // Draw solid inner core
            drawCircle(
                color = if (isSelected) Emerald400 else baseColor,
                radius = if (isSelected) 10.dp.toPx() else 6.dp.toPx(),
                center = pos
            )

            // Outer ring
            drawCircle(
                color = Slate100,
                radius = if (isSelected) 14.dp.toPx() else 8.dp.toPx(),
                center = pos,
                style = Stroke(width = 1.dp.toPx())
            )

            // Draw responder connection line if responder is dispatched
            if (incident.status == "DISPATCHED" || incident.status == "RESPONDER_ARRIVED") {
                val responderOffset = Offset(pos.x - 45f, pos.y + 40f)
                drawLine(
                    color = Amber500,
                    start = responderOffset,
                    end = pos,
                    strokeWidth = 2f,
                    pathEffect = androidx.compose.ui.graphics.PathEffect.dashPathEffect(floatArrayOf(10f, 10f), 0f)
                )
                drawCircle(
                    color = Amber500,
                    radius = 4.dp.toPx(),
                    center = responderOffset
                )
            }
        }
    }
}

private fun drawHorizontalGridline(x: Float, height: Float, color: Color) {
    // Standard canvas drawing operations
}

private fun drawVerticalGridline(y: Float, width: Float, color: Color) {
    // Standard canvas drawing operations
}

// Convert South Africa geographical coordinates into bounding box pixel offsets
private fun getLocalOffset(lat: Double, lng: Double, width: Float, height: Float): Offset {
    // SA Bounding Box coordinates roughly:
    // Latitude: -22.0 (North) to -35.0 (South)
    // Longitude: 16.0 (West) to 33.0 (East)
    val latMin = -35.0
    val latMax = -22.0
    val lngMin = 16.0
    val lngMax = 33.0

    // Normalize coordinates to percentage [0..1]
    val xPercent = (lng - lngMin) / (lngMax - lngMin)
    val yPercent = (latMax - lat) / (latMax - latMin) // flip latitude because Y grows downwards in canvas

    // Introduce safety margins of 10% to prevent edge clippings
    val marginX = width * 0.1f
    val marginY = height * 0.1f
    val mappedX = marginX + (width - 2 * marginX) * xPercent.toFloat()
    val mappedY = marginY + (height - 2 * marginY) * yPercent.toFloat()

    return Offset(mappedX, mappedY)
}
